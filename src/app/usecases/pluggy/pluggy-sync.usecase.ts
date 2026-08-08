import { injectable, inject } from "inversify";
import { PluggySyncUseCaseInterface } from "../../@shared/pluggy/usecase/pluggy.usecase.interface";
import { PluggyClientInterface } from "../../@shared/pluggy/client/pluggy-client.interface";
import { PluggyConnectionRepositoryInterface } from "../../@shared/pluggy/repository/pluggy-connection-repository.interface";
import { CardRepositoryInterface } from "../../@shared/card/repository/card-repository.interface";
import { CardExpensesRepositoryInterface } from "../../@shared/card-expenses/repository/card-expenses-repository.interface";
import CardExpensesUseCaseInterface from "../../@shared/card-expenses/usecase/card-expenses.usecase.interface";
import { PluggyTransactionDto } from "../../../domain/pluggy/dto/pluggy.dto";
import { CardDto } from "../../../domain/card/dto/card.dto";

// Mapeia a categoria (livre, mais longa) da Pluggy pra caber na coluna `category`
// do nosso banco, que hoje é CHARACTER VARYING(15) (ver categories table).
const CATEGORY_MAP: Record<string, string> = {
    "Food and drinks": "Alimentação",
    "Groceries": "Mercado",
    "Restaurants and bars": "Restaurante",
    "Transportation": "Transporte",
    "Fuel": "Transporte",
    "Health": "Saúde",
    "Entertainment": "Lazer",
    "Shopping": "Compras",
    "Services": "Serviços",
    "Bills and utilities": "Contas",
    "Education": "Educação",
    "Travel": "Viagem",
    "Electronics": "Eletrônicos"
};

function mapCategory(pluggyCategory?: string): string {
    if (!pluggyCategory) return "Outros";

    const mapped = CATEGORY_MAP[pluggyCategory];

    return (mapped || pluggyCategory).slice(0, 15);
}

@injectable()
export class PluggySyncUseCase implements PluggySyncUseCaseInterface {
    constructor(
        @inject('PluggyClient')
        private pluggyClient: PluggyClientInterface,
        @inject('PluggyConnectionRepository')
        private pluggyConnectionRepository: PluggyConnectionRepositoryInterface,
        @inject('CardRepository')
        private cardRepository: CardRepositoryInterface,
        @inject('CardExpensesRepository')
        private cardExpensesRepository: CardExpensesRepositoryInterface,
        @inject('CardExpensesUseCase')
        private cardExpensesUseCase: CardExpensesUseCaseInterface
    ) {}

    // Busca completa do histórico - usada quando um usuário/cartão é conectado pela 1ª vez.
    async syncAccountRetroactive(cardId: string): Promise<void> {
        await this.syncAccount(cardId, {});
    }

    // Busca incremental (só transações a partir de uma data) - usada pelo cron de reconciliação
    // e como fallback de segurança.
    async syncAccountIncremental(cardId: string, sinceISO?: string): Promise<void> {
        await this.syncAccount(cardId, { dateFrom: sinceISO });
    }

    private async syncAccount(cardId: string, options: { dateFrom?: string }): Promise<void> {
        const card = await this.cardRepository.findById(cardId);

        if (!card || !card.pluggyAccountId) return;

        let cursor: string | undefined = undefined;

        do {
            const page = await this.pluggyClient.fetchTransactionsPage(card.pluggyAccountId, {
                cursor,
                dateFrom: options.dateFrom,
                pageSize: 500
            });

            for (const transaction of page.results) {
                await this.upsertTransaction(card, transaction);
            }

            cursor = page.nextCursor || undefined;
        } while (cursor);
    }

    // Evento `transactions/created`: a Pluggy manda um link pronto pra gente paginar.
    async syncFromCreatedLink(link: string): Promise<void> {
        const transactions = await this.pluggyClient.fetchTransactionsFromLink(link);

        await this.upsertTransactionsGroupedByAccount(transactions);
    }

    // Evento `transactions/updated`: a Pluggy manda só os IDs que mudaram.
    async syncByTransactionIds(transactionIds: string[]): Promise<void> {
        const transactions = await this.pluggyClient.fetchTransactionsByIds(transactionIds);

        await this.upsertTransactionsGroupedByAccount(transactions);
    }

    // Evento `transactions/deleted`.
    async removeByTransactionIds(transactionIds: string[]): Promise<void> {
        await this.cardExpensesRepository.deleteByPluggyTransactionIds(transactionIds);
    }

    private async upsertTransactionsGroupedByAccount(transactions: PluggyTransactionDto[]): Promise<void> {
        const accountIds = [...new Set(transactions.map((t) => t.accountId))];

        const cardsByAccountId = new Map<string, CardDto>();

        for (const accountId of accountIds) {
            const card = await this.cardRepository.findByPluggyAccountId(accountId);

            if (card) cardsByAccountId.set(accountId, card);
        }

        for (const transaction of transactions) {
            const card = cardsByAccountId.get(transaction.accountId);

            if (!card) continue; // conta não vinculada a nenhum card nosso (ex: não é cartão de crédito)

            await this.upsertTransaction(card, transaction);
        }
    }

    private async upsertTransaction(card: CardDto, transaction: PluggyTransactionDto): Promise<void> {
        const existing = await this.cardExpensesRepository.findByPluggyTransactionId(transaction.id);

        // Convenção da Pluggy: em contas de cartão de crédito, compras (despesas) vêm com
        // amount negativo. Guardamos sempre como valor positivo, igual ao cadastro manual.
        const value = Math.abs(transaction.amount);

        if (existing) {
            await this.cardExpensesUseCase.update({
                id: existing.id,
                cardId: card.id,
                userId: card.userId,
                name: transaction.description || transaction.descriptionRaw || "Despesa",
                value,
                installments: transaction.creditCardMetadata?.totalInstallments || 1,
                referenceDate: new Date(transaction.date),
                category: mapCategory(transaction.category),
                active: true,
                recurrent: false
            });

            return;
        }

        await this.cardExpensesUseCase.create({
            cardId: card.id,
            userId: card.userId,
            name: transaction.description || transaction.descriptionRaw || "Despesa",
            value,
            installments: transaction.creditCardMetadata?.totalInstallments,
            referenceDate: new Date(transaction.date),
            category: mapCategory(transaction.category),
            active: true,
            recurrent: false,
            pluggyTransactionId: transaction.id
        });
    }

    // Rede de segurança: roda no cron, para todas as conexões ativas, buscando só os
    // últimos dias (evita reprocessar o histórico inteiro toda vez).
    async syncAllActiveConnections(): Promise<void> {
        const connections = await this.pluggyConnectionRepository.findAllActive();
        const RECONCILE_LOOKBACK_DAYS = Number(process.env.PLUGGY_RECONCILE_LOOKBACK_DAYS || 3);

        for (const connection of connections) {
            try {
                const itemStatus = await this.pluggyClient.fetchItem(connection.itemId);

                const cards = await this.cardRepository.findByUserId(connection.userId);
                const linkedCards = cards.filter((c) => c.pluggyItemId === connection.id);

                const since = new Date();
                since.setDate(since.getDate() - RECONCILE_LOOKBACK_DAYS);

                for (const card of linkedCards) {
                    await this.syncAccountIncremental(card.id, since.toISOString());
                }

                await this.pluggyConnectionRepository.update({
                    ...connection,
                    status: itemStatus.status,
                    executionStatus: itemStatus.executionStatus,
                    lastSyncedAt: new Date()
                });
            } catch (error) {
                // Não deixa uma conexão com erro travar a reconciliação das demais.
                console.error(`[pluggy] Falha ao reconciliar item ${connection.itemId}:`, error);
            }
        }
    }
}

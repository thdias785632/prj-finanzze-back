import { injectable, inject } from "inversify";
import { PluggySyncUseCaseInterface } from "../../@shared/pluggy/usecase/pluggy.usecase.interface";
import { PluggyClientInterface } from "../../@shared/pluggy/client/pluggy-client.interface";
import { PluggyConnectionRepositoryInterface } from "../../@shared/pluggy/repository/pluggy-connection-repository.interface";
import { CardRepositoryInterface } from "../../@shared/card/repository/card-repository.interface";
import { CardExpensesRepositoryInterface } from "../../@shared/card-expenses/repository/card-expenses-repository.interface";
import CardExpensesUseCaseInterface from "../../@shared/card-expenses/usecase/card-expenses.usecase.interface";
import { PluggyTransactionDto, SyncSummaryDto } from "../../../domain/pluggy/dto/pluggy.dto";
import { CardDto } from "../../../domain/card/dto/card.dto";

export enum Category {
    Moradia = "Moradia",
    Boizinho = "Boizinho",
    Transporte = "Transporte",
    Saúde = "Saúde",
    Internet = "Internet",
    Delivery = "Delivery",
    Alimentação = "Alimentação",
    Beleza = "Beleza",
    Assinaturas = "Assinaturas",
    Lazer = "Lazer",
    Outros = "Outros",
    Vestuário = "Vestuário",
    Dívidas = "Dívidas",
    Carro = "Carro",
}

export const CATEGORY_MAP: Record<string, string> = {
    "Automotive": Category.Carro,
    "Accomodation": Category.Lazer,
    "Airport and air": Category.Lazer,
    "Car rental": Category.Lazer,
    "Food delivery": Category.Delivery,
    "Gas stations": Category.Carro,
    "Gyms and fitnes": Category.Saúde,
    "Parking": Category.Carro,
    "Pet supplies an": Category.Boizinho,
    "Pharmacies": Category.Saúde,
    "Pharmacy": Category.Saúde,
    "Public transpor": Category.Transporte,
    "Taxi and ride-h": Category.Transporte,
    "Tickets": Category.Lazer,
    "Vehicle mainten": Category.Carro,
    "Wellness and fi": Category.Saúde,
    "Groceries": Category.Alimentação,
};

export function mapCategory(pluggyCategory?: string): string {
    if (!pluggyCategory) return Category.Outros;

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

    private emptySummary(): SyncSummaryDto {
        return { fetched: 0, created: 0, updated: 0, failed: 0 };
    }

    private merge(a: SyncSummaryDto, b: SyncSummaryDto): SyncSummaryDto {
        return {
            fetched: a.fetched + b.fetched,
            created: a.created + b.created,
            updated: a.updated + b.updated,
            failed: a.failed + b.failed
        };
    }

    private toDate(date: Date): string {
        return date.toISOString().slice(0, 10);
    }

    // Histórico completo do cartão (sem filtro de data) - usado ao conectar um Item pela 1ª vez.
    async syncAccountRetroactive(cardId: string): Promise<SyncSummaryDto> {
        const card = await this.cardRepository.findById(cardId);

        if (!card || !card.pluggyAccountId) return this.emptySummary();

        const transactions = await this.pluggyClient.fetchAllTransactions(card.pluggyAccountId);

        return this.upsertMany(card, transactions);
    }

    async syncAccountIncremental(cardId: string, sinceISO?: string): Promise<SyncSummaryDto> {
        const card = await this.cardRepository.findById(cardId);

        if (!card || !card.pluggyAccountId) return this.emptySummary();

        const transactions = await this.pluggyClient.fetchAllTransactions(card.pluggyAccountId, {
            dateFrom: sinceISO ? sinceISO.slice(0, 10) : undefined
        });

        return this.upsertMany(card, transactions);
    }

    // Evento `transactions/created`
    async syncFromCreatedLink(link: string): Promise<SyncSummaryDto> {
        const transactions = await this.pluggyClient.fetchTransactionsFromLink(link);

        console.log(`[pluggy-sync] transactions/created: ${transactions.length} transação(ões) no link`);

        return this.upsertGroupedByAccount(transactions);
    }

    // Evento `transactions/updated`
    async syncByTransactionIds(transactionIds: string[], accountId?: string): Promise<SyncSummaryDto> {
        const transactions = await this.pluggyClient.fetchTransactionsByIds(transactionIds, accountId);

        console.log(`[pluggy-sync] transactions/updated: ${transactions.length}/${transactionIds.length} transação(ões) encontradas`);

        return this.upsertGroupedByAccount(transactions);
    }

    // Evento `transactions/deleted`
    async removeByTransactionIds(transactionIds: string[]): Promise<void> {
        await this.cardExpensesRepository.deleteByPluggyTransactionIds(transactionIds);
    }

    // Sincroniza os últimos `lookbackDays` dias de TODOS os cartões vinculados a um Item.
    // É o caminho que não depende do webhook `transactions/created`: ele roda no `item/updated`,
    // no cron de reconciliação e no endpoint manual.
    async syncItem(itemId: string, lookbackDays?: number): Promise<SyncSummaryDto> {
        const connection = await this.pluggyConnectionRepository.findByItemId(itemId);

        if (!connection) {
            console.warn(`[pluggy-sync] Item ${itemId} não está vinculado a nenhum usuário`);

            return this.emptySummary();
        }

        const days = lookbackDays ?? Number(process.env.PLUGGY_RECONCILE_LOOKBACK_DAYS || 7);
        const since = new Date();

        since.setDate(since.getDate() - days);

        const cards = (await this.cardRepository.findByUserId(connection.userId))
            .filter((card) => card.pluggyItemId === connection.id && card.pluggyAccountId);

        let summary = this.emptySummary();

        for (const card of cards) {
            const transactions = await this.pluggyClient.fetchAllTransactions(card.pluggyAccountId as string, {
                dateFrom: this.toDate(since)
            });

            summary = this.merge(summary, await this.upsertMany(card, transactions));
        }

        await this.pluggyConnectionRepository.update({ ...connection, lastSyncedAt: new Date() });

        console.log(`[pluggy-sync] Item ${itemId}: ${cards.length} cartão(ões), últimos ${days} dias ->`, summary);

        return summary;
    }

    async syncUser(userId: string, lookbackDays?: number): Promise<SyncSummaryDto> {
        const connections = await this.pluggyConnectionRepository.findByUserId(userId);

        let summary = this.emptySummary();

        for (const connection of connections) {
            summary = this.merge(summary, await this.syncItem(connection.itemId, lookbackDays));
        }

        return summary;
    }

    // Rede de segurança (cron frequente): re-sincroniza o que a Pluggy JÁ coletou.
    async syncAllActiveConnections(): Promise<void> {
        const connections = await this.pluggyConnectionRepository.findAllActive();

        for (const connection of connections) {
            try {
                const itemStatus = await this.pluggyClient.fetchItem(connection.itemId);

                await this.pluggyConnectionRepository.update({
                    ...connection,
                    status: itemStatus.status,
                    executionStatus: itemStatus.executionStatus
                });

                await this.syncItem(connection.itemId);
            } catch (error) {
                // Não deixa uma conexão com erro travar as demais.
                console.error(`[pluggy] Falha ao reconciliar item ${connection.itemId}:`, error);
            }
        }
    }

    // Job diário: pede à Pluggy para ir ao banco buscar dados novos. Quando ela terminar, envia o
    // webhook `item/updated`, que dispara o `syncItem`. Não espera o término aqui.
    async refreshAllItems(userId?: string): Promise<{ requested: number; failed: number }> {
        const connections = userId
            ? await this.pluggyConnectionRepository.findByUserId(userId)
            : await this.pluggyConnectionRepository.findAllActive();

        let requested = 0;
        let failed = 0;

        for (const connection of connections) {
            try {
                await this.pluggyClient.refreshItem(connection.itemId);
                requested++;
            } catch (error) {
                failed++;
                console.error(`[pluggy] Falha ao solicitar atualização do item ${connection.itemId}:`, error);
            }
        }

        console.log(`[pluggy] Atualização solicitada para ${requested} item(ns); falhas: ${failed}`);

        return { requested, failed };
    }

    private async upsertGroupedByAccount(transactions: PluggyTransactionDto[]): Promise<SyncSummaryDto> {
        let summary = this.emptySummary();

        const accountIds = [...new Set(transactions.map((t) => t.accountId))];

        for (const accountId of accountIds) {
            const card = await this.cardRepository.findByPluggyAccountId(accountId);

            if (!card) {
                console.log(`[pluggy-sync] Conta ${accountId} sem cartão vinculado; ignorando`);
                continue;
            }

            summary = this.merge(summary, await this.upsertMany(card, transactions.filter((t) => t.accountId === accountId)));
        }

        return summary;
    }

    // Uma transação com erro não pode abortar as demais (antes o erro ficava escondido no webhook).
    private async upsertMany(card: CardDto, transactions: PluggyTransactionDto[]): Promise<SyncSummaryDto> {
        const summary = this.emptySummary();

        summary.fetched = transactions.length;

        for (const transaction of transactions) {
            try {
                const result = await this.upsertTransaction(card, transaction);

                summary[result]++;
            } catch (error) {
                summary.failed++;
                console.error(`[pluggy-sync] Falha ao gravar transação ${transaction.id} (${transaction.description}):`, error);
            }
        }

        return summary;
    }

    private async upsertTransaction(card: CardDto, transaction: PluggyTransactionDto): Promise<'created' | 'updated'> {
        const existing = await this.cardExpensesRepository.findByPluggyTransactionId(transaction.id);

        const value = Math.abs(transaction.amount);
        const name = (transaction.description || transaction.descriptionRaw || "Despesa").slice(0, 255);

        if (existing) {
            await this.cardExpensesUseCase.update({
                id: existing.id,
                cardId: card.id,
                userId: card.userId,
                name,
                value,
                installments: transaction.creditCardMetadata?.totalInstallments || 1,
                referenceDate: new Date(transaction.date),
                category: mapCategory(transaction.category),
                active: true,
                recurrent: false
            });

            return 'updated';
        }

        await this.cardExpensesUseCase.create({
            cardId: card.id,
            userId: card.userId,
            name,
            value,
            installments: transaction.creditCardMetadata?.totalInstallments,
            referenceDate: new Date(transaction.date),
            category: mapCategory(transaction.category),
            active: true,
            recurrent: false,
            pluggyTransactionId: transaction.id
        });

        return 'created';
    }
}

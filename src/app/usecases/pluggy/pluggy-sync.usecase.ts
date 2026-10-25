import { injectable, inject } from "inversify";
import { PluggySyncUseCaseInterface } from "../../@shared/pluggy/usecase/pluggy.usecase.interface";
import { PluggyClientInterface } from "../../@shared/pluggy/client/pluggy-client.interface";
import { PluggyConnectionRepositoryInterface } from "../../@shared/pluggy/repository/pluggy-connection-repository.interface";
import { CardRepositoryInterface } from "../../@shared/card/repository/card-repository.interface";
import { CardExpensesRepositoryInterface } from "../../@shared/card-expenses/repository/card-expenses-repository.interface";
import CardExpensesUseCaseInterface from "../../@shared/card-expenses/usecase/card-expenses.usecase.interface";
import { PluggyTransactionDto } from "../../../domain/pluggy/dto/pluggy.dto";
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

    const mapped = CATEGORY_MAP[pluggyCategory] || "Outros";

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

    async syncAccountRetroactive(cardId: string): Promise<void> {
        await this.syncAccount(cardId, {});
    }

    async syncAccountIncremental(cardId: string, sinceISO?: string): Promise<void> {
        await this.syncAccount(cardId, { dateFrom: sinceISO });
    }

    private async syncAccount(cardId: string, options: { dateFrom?: string }): Promise<void> {
        const card = await this.cardRepository.findById(cardId);

        if (!card || !card.pluggyAccountId) return;

        let cursor: string | undefined = undefined;

        const pageData = await this.pluggyClient.fetchTransactionsPage(card.pluggyAccountId, {
            cursor,
            dateFrom: options.dateFrom,
            pageSize: 500
        });

        for (const transaction of pageData.results) {
            await this.upsertTransaction(card, transaction);
        };
    }

    async syncFromCreatedLink(link: string): Promise<void> {
        const transactions = await this.pluggyClient.fetchTransactionsFromLink(link);

        await this.upsertTransactionsGroupedByAccount(transactions);
    }

    async syncByTransactionIds(transactionIds: string[]): Promise<void> {
        const transactions = await this.pluggyClient.fetchTransactionsByIds(transactionIds);

        await this.upsertTransactionsGroupedByAccount(transactions);
    }

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

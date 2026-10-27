import { injectable, inject } from "inversify";
import { randomUUID } from "crypto";
import { PluggyConnectionUseCaseInterface, inputConnectItem, PluggySyncUseCaseInterface } from "../../@shared/pluggy/usecase/pluggy.usecase.interface";
import { PluggyClientInterface } from "../../@shared/pluggy/client/pluggy-client.interface";
import { PluggyConnectionRepositoryInterface } from "../../@shared/pluggy/repository/pluggy-connection-repository.interface";
import CardUseCaseInterface from "../../@shared/card/usecases/card.usecase.interface";
import { CardRepositoryInterface } from "../../@shared/card/repository/card-repository.interface";

@injectable()
export class PluggyConnectionUseCase implements PluggyConnectionUseCaseInterface {
    constructor(
        @inject('PluggyClient')
        private pluggyClient: PluggyClientInterface,
        @inject('PluggyConnectionRepository')
        private pluggyConnectionRepository: PluggyConnectionRepositoryInterface,
        @inject('CardUseCase')
        private cardUseCase: CardUseCaseInterface,
        @inject('CardRepository')
        private cardRepository: CardRepositoryInterface,
        @inject('PluggySyncUseCase')
        private pluggySyncUseCase: PluggySyncUseCaseInterface
    ) {}

    async connectItem(input: inputConnectItem): Promise<void> {
        const itemStatus = await this.pluggyClient.fetchItem(input.itemId);
        
        let connection = await this.pluggyConnectionRepository.findByItemId(input.itemId);
        
        const connectionId = connection?.id || randomUUID();

        if (!connection) {
            await this.pluggyConnectionRepository.create({
                id: connectionId,
                userId: input.userId,
                itemId: input.itemId,
                connectorId: itemStatus.connector?.id,
                connectorName: itemStatus.connector?.name,
                status: itemStatus.status,
                executionStatus: itemStatus.executionStatus,
                webhookRegistered: false,
                createdAt: new Date()
            });
        } else {
            await this.pluggyConnectionRepository.update({
                ...connection,
                status: itemStatus.status,
                executionStatus: itemStatus.executionStatus
            });
        }

        const accounts = await this.pluggyClient.fetchAccounts(input.itemId);

        const creditAccounts = accounts.filter((account) => account.type === 'CREDIT');

        for (const account of creditAccounts) {
            let card = await this.cardRepository.findByPluggyAccountId(account.id);

            if (!card) {
                await this.cardUseCase.create({
                    userId: input.userId,
                    name: account.marketingName || account.name,
                    active: true,
                    flag: account.creditData?.brand || 'unknown',
                    pluggyItemId: connectionId,
                    pluggyAccountId: account.id
                });

                card = await this.cardRepository.findByPluggyAccountId(account.id);
            }

            if (card) {
                await this.pluggySyncUseCase.syncAccountRetroactive(card.id);
            }
        }

        const webhookUrl = process.env.PLUGGY_WEBHOOK_URL;

        if (webhookUrl) {
            await this.pluggyClient.ensureWebhook(webhookUrl);
        }

        const finalConnection = await this.pluggyConnectionRepository.findByItemId(input.itemId);

        if (finalConnection) {
            await this.pluggyConnectionRepository.update({
                ...finalConnection,
                webhookRegistered: !!webhookUrl,
                lastSyncedAt: new Date()
            });
        }
    }

    async handleItemUpdated(itemId: string): Promise<void> {
        console.log(`[pluggy-connection] Tratando atualização do item: ${itemId}`);

        const itemStatus = await this.pluggyClient.fetchItem(itemId);
        const connection = await this.pluggyConnectionRepository.findByItemId(itemId);

        console.log(`[pluggy-connection] Item status:`, itemStatus);
        console.log(`[pluggy-connection] Connection:`, connection);
        
        if (!connection) return;

        await this.pluggyConnectionRepository.update({
            ...connection,
            status: itemStatus.status,
            executionStatus: itemStatus.executionStatus
        });
    }
}

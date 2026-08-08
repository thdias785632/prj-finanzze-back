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

    // Vincula um Item já existente na Pluggy (criado via Pluggy Connect ou, no caso da conta
    // demo/sandbox, diretamente pelo Dashboard da Pluggy) a um usuário do Finanzze.
    // - cria (ou atualiza) o registro de conexão em `pluggy_items`
    // - cria automaticamente um `card` pra cada conta do tipo CREDIT encontrada no Item
    // - dispara a busca retroativa (histórico completo) pra cada card novo
    // - garante que o webhook está registrado na Pluggy, pra manter tudo sincronizado depois
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
                // Novo usuário/cartão: traz o histórico inteiro disponível na Pluggy.
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

    // Chamado pelo webhook `item/updated` - atualiza status e, se o Item passou a ficar
    // OK depois de um erro (ex: MFA resolvido), garante que os dados mais recentes sejam puxados.
    async handleItemUpdated(itemId: string): Promise<void> {
        const itemStatus = await this.pluggyClient.fetchItem(itemId);
        const connection = await this.pluggyConnectionRepository.findByItemId(itemId);

        if (!connection) return;

        await this.pluggyConnectionRepository.update({
            ...connection,
            status: itemStatus.status,
            executionStatus: itemStatus.executionStatus
        });
    }
}

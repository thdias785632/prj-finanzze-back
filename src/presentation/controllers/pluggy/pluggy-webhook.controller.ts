import { PluggySyncUseCaseInterface, PluggyConnectionUseCaseInterface } from "../../../app/@shared/pluggy/usecase/pluggy.usecase.interface";

export default class PluggyWebhookController {
    constructor(
        private syncUseCase: PluggySyncUseCaseInterface,
        private connectionUseCase: PluggyConnectionUseCaseInterface
    ) {}

    async receive(req: any, res: any): Promise<any> {
        const payload = req.body || {};

        res.status(200).json({ received: true });

        this.process(payload).catch((error) => {
            console.error(`[pluggy-webhook] Falha ao processar evento ${payload?.event}:`, error);
        });
    };

    private async process(payload: any): Promise<void> {
        console.log(`[pluggy-webhook] Evento recebido: ${payload?.event}`, JSON.stringify(payload));

        switch (payload.event) {
            case 'transactions/created':
                await this.syncUseCase.syncFromCreatedLink(payload.createdTransactionsLink);
                break;

            case 'transactions/updated':
                await this.syncUseCase.syncByTransactionIds(payload.transactionIds || [], payload.accountId);
                break;

            case 'transactions/deleted':
                await this.syncUseCase.removeByTransactionIds(payload.transactionIds || []);
                break;

            case 'item/created':
            case 'item/updated':
                // A Pluggy nem sempre envia `transactions/created`. Por isso, sempre que um Item termina
                // de atualizar, sincronizamos os últimos dias dos cartões dele (idempotente).
                await this.connectionUseCase.handleItemUpdated(payload.itemId);
                await this.syncUseCase.syncItem(payload.itemId);
                break;

            default:
                console.log(`[pluggy-webhook] Evento não tratado: ${payload.event}`);
        }
    }
}

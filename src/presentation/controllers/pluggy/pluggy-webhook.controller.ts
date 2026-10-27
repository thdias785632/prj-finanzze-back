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
        console.log(`[pluggy-webhook] Evento recebido: ${payload?.event}`, payload);
        
        switch (payload.event) {
            case 'transactions/created':
                await this.syncUseCase.syncFromCreatedLink(payload.createdTransactionsLink);
                break;

            case 'transactions/updated':
                await this.syncUseCase.syncByTransactionIds(payload.transactionIds || []);
                break;

            case 'transactions/deleted':
                await this.syncUseCase.removeByTransactionIds(payload.transactionIds || []);
                break;

            case 'item/updated':
            case 'item/created':
                await this.connectionUseCase.handleItemUpdated(payload.itemId);
                break;

            default:
                console.log(`[pluggy-webhook] Evento não tratado: ${payload.event}`);
        }
    }
}

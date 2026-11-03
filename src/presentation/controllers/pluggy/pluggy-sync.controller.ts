import { PluggySyncUseCaseInterface } from "../../../app/@shared/pluggy/usecase/pluggy.usecase.interface";
import { PluggyClientInterface } from "../../../app/@shared/pluggy/client/pluggy-client.interface";

// Endpoints de operação/diagnóstico da integração Pluggy.
export default class PluggySyncController {
    constructor(
        private syncUseCase: PluggySyncUseCaseInterface,
        private pluggyClient: PluggyClientInterface
    ) {}

    // POST /api/pluggy/sync { userId, days? }
    // Sincroniza AGORA os últimos `days` dias (padrão 7) dos cartões do usuário e devolve o resumo.
    async sync(req: any, res: any): Promise<any> {
        try {
            const { userId, days } = req.body;

            if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

            const summary = await this.syncUseCase.syncUser(userId, days ? Number(days) : undefined);

            return res.status(200).json(summary);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    // POST /api/pluggy/refresh { userId? }
    // Pede à Pluggy para coletar dados novos no banco. Quando terminar, chega o webhook item/updated.
    async refresh(req: any, res: any): Promise<any> {
        try {
            const result = await this.syncUseCase.refreshAllItems(req.body?.userId);

            return res.status(202).json(result);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    // GET /api/pluggy/webhooks -> o que está registrado na Pluggy
    async webhooks(req: any, res: any): Promise<any> {
        try {
            return res.status(200).json({
                configuredUrl: process.env.PLUGGY_WEBHOOK_URL || null,
                registered: await this.pluggyClient.listWebhooks()
            });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    // POST /api/pluggy/webhooks/register -> (re)registra os eventos para PLUGGY_WEBHOOK_URL
    async registerWebhooks(req: any, res: any): Promise<any> {
        try {
            const url = process.env.PLUGGY_WEBHOOK_URL;

            if (!url) return res.status(400).json({ message: 'PLUGGY_WEBHOOK_URL não configurada' });

            return res.status(200).json({ registered: await this.pluggyClient.ensureWebhook(url) });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }
}

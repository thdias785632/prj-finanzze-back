import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { PluggyClientInterface } from "../../../app/@shared/pluggy/client/pluggy-client.interface";
import PluggySyncController from "../../../presentation/controllers/pluggy/pluggy-sync.controller";
import { PluggyConnectionUseCaseInterface, PluggySyncUseCaseInterface } from "../../../app/@shared/pluggy/usecase/pluggy.usecase.interface";
import PluggyConnectionController from "../../../presentation/controllers/pluggy/pluggy-connection.controller";
import PluggyWebhookController from "../../../presentation/controllers/pluggy/pluggy-webhook.controller";

export const pluggyRoute = Router();

const connectionUseCase = container.get<PluggyConnectionUseCaseInterface>('PluggyConnectionUseCase');
const syncUseCase = container.get<PluggySyncUseCaseInterface>('PluggySyncUseCase');
const pluggyClient = container.get<PluggyClientInterface>('PluggyClient');

pluggyRoute.post('/connections', async (request: Request, response: Response) => {
    const controller = new PluggyConnectionController(connectionUseCase);

    await controller.connect(request, response);
    // #swagger.tags = ['Pluggy']
    // #swagger.summary = 'Conecta um Item da Pluggy a um usuário'
    // #swagger.description = 'Vincula um Item (conexão bancária) já existente na Pluggy ao usuário, cria os cards de crédito correspondentes e dispara a busca retroativa de despesas.'
    /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            userId: { type: "string" },
                            itemId: { type: "string" }
                        }
                    }
                }
            }
        }
    */
});

pluggyRoute.post('/webhook', async (request: Request, response: Response) => {
    const controller = new PluggyWebhookController(syncUseCase, connectionUseCase);

    await controller.receive(request, response);
    // #swagger.tags = ['Pluggy']
    // #swagger.summary = 'Webhook de eventos da Pluggy'
    // #swagger.description = 'Endpoint chamado pela Pluggy quando há novas transações, atualizações ou exclusões.'
});

pluggyRoute.post('/sync', async (request: Request, response: Response) => {
    const controller = new PluggySyncController(syncUseCase, pluggyClient);

    await controller.sync(request, response);
    // #swagger.tags = ['Pluggy']
    // #swagger.summary = 'Sincroniza agora as despesas dos cartões do usuário (últimos dias)'
});

pluggyRoute.post('/refresh', async (request: Request, response: Response) => {
    const controller = new PluggySyncController(syncUseCase, pluggyClient);

    await controller.refresh(request, response);
    // #swagger.tags = ['Pluggy']
    // #swagger.summary = 'Pede à Pluggy para coletar dados novos no banco (PATCH /items)'
});

pluggyRoute.get('/webhooks', async (request: Request, response: Response) => {
    const controller = new PluggySyncController(syncUseCase, pluggyClient);

    await controller.webhooks(request, response);
    // #swagger.tags = ['Pluggy']
    // #swagger.summary = 'Lista os webhooks registrados na Pluggy'
});

pluggyRoute.post('/webhooks/register', async (request: Request, response: Response) => {
    const controller = new PluggySyncController(syncUseCase, pluggyClient);

    await controller.registerWebhooks(request, response);
    // #swagger.tags = ['Pluggy']
    // #swagger.summary = '(Re)registra os eventos do webhook na Pluggy'
});

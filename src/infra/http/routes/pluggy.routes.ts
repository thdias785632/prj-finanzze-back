import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { PluggyConnectionUseCaseInterface, PluggySyncUseCaseInterface } from "../../../app/@shared/pluggy/usecase/pluggy.usecase.interface";
import PluggyConnectionController from "../../../presentation/controllers/pluggy/pluggy-connection.controller";
import PluggyWebhookController from "../../../presentation/controllers/pluggy/pluggy-webhook.controller";

export const pluggyRoute = Router();

const connectionUseCase = container.get<PluggyConnectionUseCaseInterface>('PluggyConnectionUseCase');
const syncUseCase = container.get<PluggySyncUseCaseInterface>('PluggySyncUseCase');

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

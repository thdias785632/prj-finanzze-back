import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { IndiceUseCaseInterface } from "../../../app/@shared/indice/usecases/indice.usecase.interface";
import IndiceController from "../../../presentation/controllers/indice/indice.controller";

export const indiceRoute = Router();

const controller = new IndiceController(container.get<IndiceUseCaseInterface>('IndiceUseCase'));

indiceRoute.get('/incc', async (request: Request, response: Response) => {
    await controller.listIncc(request, response);
    // #swagger.tags = ['Índices']
    // #swagger.summary = 'Variação mensal do INCC'
});

indiceRoute.post('/incc/sync', async (request: Request, response: Response) => {
    await controller.syncIncc(request, response);
    // #swagger.tags = ['Índices']
    // #swagger.summary = 'Sincronizar INCC com o Banco Central (SGS 192)'
});

indiceRoute.put('/incc', async (request: Request, response: Response) => {
    await controller.setIncc(request, response);
    // #swagger.tags = ['Índices']
    // #swagger.summary = 'Informar manualmente a variação do INCC de um mês'
});

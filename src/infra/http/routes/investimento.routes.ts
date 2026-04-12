import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { InvestimentoUseCase } from "../../../app/usecases/investimento/investimento.usecase";
import InvestimentoController from "../../../presentation/controllers/investimento/investimento.controller";

export const investimentoRoute = Router();

const useCase = container.get<InvestimentoUseCase>('InvestimentoUseCase');

investimentoRoute.post('/', async (request: Request, response: Response) => {
    const controller = new InvestimentoController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['Investimento']
    // #swagger.summary = 'Criar ativo de investimento'
});

investimentoRoute.get('/get-by-user', async (request: Request, response: Response) => {
    const controller = new InvestimentoController(useCase);

    await controller.findByUserId(request, response);
    // #swagger.tags = ['Investimento']
    // #swagger.summary = 'Listar ativos por usuário'
});

investimentoRoute.get('/get-by-id', async (request: Request, response: Response) => {
    const controller = new InvestimentoController(useCase);

    await controller.findById(request, response);
    // #swagger.tags = ['Investimento']
    // #swagger.summary = 'Buscar ativo por id'
});

investimentoRoute.put('/', async (request: Request, response: Response) => {
    const controller = new InvestimentoController(useCase);

    await controller.update(request, response);
    // #swagger.tags = ['Investimento']
    // #swagger.summary = 'Atualizar ativo de investimento'
});

investimentoRoute.delete('/', async (request: Request, response: Response) => {
    const controller = new InvestimentoController(useCase);

    await controller.delete(request, response);
    // #swagger.tags = ['Investimento']
    // #swagger.summary = 'Deletar ativo de investimento'
});

import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { CategoriaInvestimentoUseCase } from "../../../app/usecases/categoria-investimento/categoria-investimento.usecase";
import CategoriaInvestimentoController from "../../../presentation/controllers/categoria-investimento/categoria-investimento.controller";

export const categoriaInvestimentoRoute = Router();

const useCase = container.get<CategoriaInvestimentoUseCase>('CategoriaInvestimentoUseCase');

categoriaInvestimentoRoute.post('/', async (request: Request, response: Response) => {
    const controller = new CategoriaInvestimentoController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['CategoriaInvestimento']
    // #swagger.summary = 'Criar categoria de investimento'
});

categoriaInvestimentoRoute.get('/get-by-user', async (request: Request, response: Response) => {
    const controller = new CategoriaInvestimentoController(useCase);

    await controller.findByUserId(request, response);
    // #swagger.tags = ['CategoriaInvestimento']
    // #swagger.summary = 'Listar categorias por usuário'
});

categoriaInvestimentoRoute.get('/get-by-id', async (request: Request, response: Response) => {
    const controller = new CategoriaInvestimentoController(useCase);

    await controller.findById(request, response);
    // #swagger.tags = ['CategoriaInvestimento']
    // #swagger.summary = 'Buscar categoria por id'
});

categoriaInvestimentoRoute.delete('/', async (request: Request, response: Response) => {
    const controller = new CategoriaInvestimentoController(useCase);

    await controller.delete(request, response);
    // #swagger.tags = ['CategoriaInvestimento']
    // #swagger.summary = 'Deletar categoria de investimento'
});

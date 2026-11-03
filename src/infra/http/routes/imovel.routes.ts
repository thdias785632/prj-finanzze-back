import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import ImovelUseCaseInterface from "../../../app/@shared/imovel/usecases/imovel.usecase.interface";
import ImovelController from "../../../presentation/controllers/imovel/imovel.controller";

export const imovelRoute = Router();

const useCase = container.get<ImovelUseCaseInterface>('ImovelUseCase');
const controller = new ImovelController(useCase);

imovelRoute.post('/', async (request: Request, response: Response) => {
    await controller.create(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Cadastrar imóvel com seus fluxos de pagamento'
});

imovelRoute.get('/get-by-user', async (request: Request, response: Response) => {
    await controller.findByUserId(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Listar imóveis do usuário (resumo com valores corrigidos pelo INCC)'
});

imovelRoute.get('/get-by-id', async (request: Request, response: Response) => {
    await controller.findById(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Detalhe do imóvel: fluxos e parcelas com valor corrigido'
});

imovelRoute.put('/', async (request: Request, response: Response) => {
    await controller.update(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Atualizar imóvel (inclui defasagem e mês-base do INCC)'
});

imovelRoute.delete('/', async (request: Request, response: Response) => {
    await controller.delete(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Remover imóvel'
});

imovelRoute.post('/fluxos', async (request: Request, response: Response) => {
    await controller.addFluxo(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Adicionar fluxo de pagamento ao imóvel'
});

imovelRoute.delete('/fluxos', async (request: Request, response: Response) => {
    await controller.deleteFluxo(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Remover fluxo de pagamento'
});

imovelRoute.patch('/parcelas/pay', async (request: Request, response: Response) => {
    await controller.payParcela(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Marcar parcela como paga'
});

imovelRoute.patch('/parcelas/unpay', async (request: Request, response: Response) => {
    await controller.unpayParcela(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Desfazer pagamento da parcela'
});

imovelRoute.put('/parcelas', async (request: Request, response: Response) => {
    await controller.updateParcela(request, response);
    // #swagger.tags = ['Imóveis']
    // #swagger.summary = 'Editar valor-base ou vencimento de uma parcela em aberto'
});

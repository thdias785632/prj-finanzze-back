import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { CompleteExtractUseCase } from "../../../app/usecases/extract/complete-extract.usecase";
import CompleteExtractController from "../../../presentation/controllers/extract/complete-extract.controller";
import CardExpensesController from "../../../presentation/controllers/card-expenses/card-expenses.controller";
import { CardExpensesUseCase } from "../../../app/usecases/card-expenses/card-expenses.usecase";
import { DailyReportService } from "../../../app/services/daily-report/daily-report";

export const extractRoute = Router();

extractRoute.get('/complete-extract', async (request: Request, response: Response) => {
    const useCase = container.get<CompleteExtractUseCase>('CompleteExtractUseCase');

    const controller = new CompleteExtractController(useCase);

    await controller.handle(request, response);
    // #swagger.tags = ['Extracts']
    // #swagger.summary = 'Get a complete extract'
    // #swagger.description = 'Endpoint to get a complete extract.'
    /* #swagger.parameters['userId'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
    /* #swagger.parameters['month'] = {
            in: 'query',
            type: 'string',
            description: 'Month',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = { 
            description: 'Extract found', 
            schema: { $ref: '#/definitions/getCompleteExtract' } 
        } 
    */
});

extractRoute.get('/complete-cards-extract', async (request: Request, response: Response) => {
    const useCase = container.get<CompleteExtractUseCase>('CompleteExtractUseCase');
    
    const controller = new CompleteExtractController(useCase);

    await controller.handleCardExtract(request, response);
    // #swagger.tags = ['Extracts']
    // #swagger.summary = 'List Cards Extracts'
    // #swagger.description = 'Endpoint to list a Card Extracts.'
    /* #swagger.parameters['userId'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
    /* #swagger.parameters['month'] = {
            in: 'query',
            type: 'string',
            description: 'month',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of CardExpensess",
            schema:{ $ref: "#/definitions/getCardsExtract" }
        }
    */
});

extractRoute.get('/send-extract', async (request: Request, response: Response) => {
    const dailyReportService = container.get('DailyReportService') as DailyReportService;
    
    await dailyReportService.execute(request.query.email as any);

    response.status(200).json({ message: 'Email enviado com sucesso!!'})
    // #swagger.tags = ['Extracts']
    // #swagger.summary = 'Send Extract Mail'
    // #swagger.description = 'Endpoint to send Extracts.'
    /* #swagger.parameters['email'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
});
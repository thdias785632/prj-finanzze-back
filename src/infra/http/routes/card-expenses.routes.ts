import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { CardExpensesUseCase } from "../../../app/usecases/card-expenses/card-expenses.usecase";
import CardExpensesController from "../../../presentation/controllers/card-expenses/card-expenses.controller";

export const cardExpensesRoute = Router();

const useCase = container.get<CardExpensesUseCase>('CardExpensesUseCase');

cardExpensesRoute.post('/', async (request: Request, response: Response) => {
    const controller = new CardExpensesController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['CardExpensess']
    // #swagger.summary = 'Create a new card expense'
    // #swagger.description = 'Endpoint to create a card expense.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createCardExpense" }
        } 
    */
});

cardExpensesRoute.put('/', async (request: Request, response: Response) => {
    const controller = new CardExpensesController(useCase);

    await controller.update(request, response);
    // #swagger.tags = ['CardExpensess']
    // #swagger.summary = 'Update a card expense'
    // #swagger.description = 'Endpoint to update a card expense.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createCardExpense" }
        } 
    */
});

cardExpensesRoute.delete('/', async (request: Request, response: Response) => {
    const controller = new CardExpensesController(useCase);

    await controller.delete(request, response);
    // #swagger.tags = ['CardExpensess']
    // #swagger.summary = 'Delete a cardExpenses'
    // #swagger.description = 'Endpoint to Delete a cardExpenses.'
    /* #swagger.parameters['id'] = {
            in: 'query',
            type: 'string',
            description: 'Id',
            required: true, 
        } 
    */
});
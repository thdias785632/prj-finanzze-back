import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import ExpensessUseCase from "../../../app/usecases/expensess/expensess.usecase";
import ExpensessController from "../../../presentation/controllers/expenses/expensess.controller";

export const expensessRoute = Router();

const useCase = container.get<ExpensessUseCase>('ExpensessUseCase');

expensessRoute.post('/', async (request: Request, response: Response) => {
    const controller = new ExpensessController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['Expensess']
    // #swagger.summary = 'Create a new expense'
    // #swagger.description = 'Endpoint to create a expense.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createExpenses" }
        } 
    */
});

expensessRoute.put('/', async (request: Request, response: Response) => {
    const controller = new ExpensessController(useCase);

    await controller.update(request, response);
    // #swagger.tags = ['Expensess']
    // #swagger.summary = 'Update a expense'
    // #swagger.description = 'Endpoint to update a expense.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createExpenses" }
        } 
    */
});

expensessRoute.get('/get-by-id', async (request: Request, response: Response) => {
    const controller = new ExpensessController(useCase);

    await controller.findById(request, response);
    // #swagger.tags = ['Expensess']
    // #swagger.summary = 'List Expensess'
    // #swagger.description = 'Endpoint to list a expenses.'
    /* #swagger.parameters['id'] = {
            in: 'query',
            type: 'string',
            description: 'Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of Expensess",
            schema:{ $ref: "#/definitions/getExpensess" }
        }
    */
});

expensessRoute.get('/get-by-user', async (request: Request, response: Response) => {
    const controller = new ExpensessController(useCase);

    await controller.findByUserId(request, response);
    // #swagger.tags = ['Expensess']
    // #swagger.summary = 'List Expensess'
    // #swagger.description = 'Endpoint to list a expenses by userId.'
    /* #swagger.parameters['userId'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of Expensess",
            schema:{ $ref: "#/definitions/getExpensess" }
        }
    */
});

expensessRoute.delete('/', async (request: Request, response: Response) => {
    const controller = new ExpensessController(useCase);

    await controller.delete(request, response);
    // #swagger.tags = ['Expensess']
    // #swagger.summary = 'Delete a expenses'
    // #swagger.description = 'Endpoint to delete a expenses.'
    /* #swagger.parameters['id'] = {
            in: 'query',
            type: 'string',
            description: 'Id',
            required: true, 
        } 
    */
});
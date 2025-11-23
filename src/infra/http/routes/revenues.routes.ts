import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import RevenuesUseCase from "../../../app/usecases/revenues/revenues-usecase";
import RevenuesController from "../../../presentation/controllers/revenues/revenues.controller";

export const revenuesRoute = Router();

const useCase = container.get<RevenuesUseCase>('RevenuesUseCase');

revenuesRoute.post('/', async (request: Request, response: Response) => {
    const controller = new RevenuesController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['Revenues']
    // #swagger.summary = 'Create a new expense'
    // #swagger.description = 'Endpoint to create a expense.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createRevenues" }
        } 
    */
});

revenuesRoute.get('/get-by-id', async (request: Request, response: Response) => {
    const controller = new RevenuesController(useCase);

    await controller.findById(request, response);
    // #swagger.tags = ['Revenues']
    // #swagger.summary = 'List revenues'
    // #swagger.description = 'Endpoint to list a revenues.'
    /* #swagger.parameters['id'] = {
            in: 'query',
            type: 'string',
            description: 'Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of revenues",
            schema:{ $ref: "#/definitions/getRevenues" }
        }
    */
});

revenuesRoute.get('/get-by-user', async (request: Request, response: Response) => {
    const controller = new RevenuesController(useCase);

    await controller.findByUserId(request, response);
    // #swagger.tags = ['Revenues']
    // #swagger.summary = 'List revenues'
    // #swagger.description = 'Endpoint to list a revenues by userId.'
    /* #swagger.parameters['userId'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of revenues",
            schema:{ $ref: "#/definitions/getRevenues" }
        }
    */
});

revenuesRoute.delete('/', async (request: Request, response: Response) => {
    const controller = new RevenuesController(useCase);

    await controller.delete(request, response);
    // #swagger.tags = ['Revenues']
    // #swagger.summary = 'Delete a revenues'
    // #swagger.description = 'Endpoint to delete a revenues.'
    /* #swagger.parameters['id'] = {
            in: 'query',
            type: 'string',
            description: 'Id',
            required: true, 
        } 
    */
});
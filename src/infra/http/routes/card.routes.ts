import { Request, Response, Router } from "express";
import { CardUseCase } from "../../../app/usecases/card/card.usecase";
import { container } from "../../../app/database-injection/injection";
import CardController from "../../../presentation/controllers/card/card.controller";

export const cardRoute = Router();

const useCase = container.get<CardUseCase>('CardUseCase');

cardRoute.post('/', async (request: Request, response: Response) => {
    const controller = new CardController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['Cards']
    // #swagger.summary = 'Create a new card'
    // #swagger.description = 'Endpoint to create a card.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createCard" }
        } 
    */
});

cardRoute.get('/get-by-id', async (request: Request, response: Response) => {
    const controller = new CardController(useCase);

    await controller.findById(request, response);
    // #swagger.tags = ['Cards']
    // #swagger.summary = 'List cards'
    // #swagger.description = 'Endpoint to list a card.'
    /* #swagger.parameters['id'] = {
            in: 'query',
            type: 'string',
            description: 'Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of Cards",
            schema:{ $ref: "#/definitions/getCards" }
        }
    */
});

cardRoute.get('/get-by-user', async (request: Request, response: Response) => {
    const controller = new CardController(useCase);

    await controller.findByUserId(request, response);
    // #swagger.tags = ['Cards']
    // #swagger.summary = 'List cards'
    // #swagger.description = 'Endpoint to list a card by userId.'
    /* #swagger.parameters['userId'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of Cards",
            schema:{ $ref: "#/definitions/getCards" }
        }
    */
});

cardRoute.put('/', async (request: Request, response: Response) => {
    const controller = new CardController(useCase);

    await controller.update(request, response);
    // #swagger.tags = ['Cards']
    // #swagger.summary = 'Update a card'
    // #swagger.description = 'Endpoint to update a card.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/updateCard" }
        } 
    */
});
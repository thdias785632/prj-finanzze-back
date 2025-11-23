import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import CategoriesController from "../../../presentation/controllers/categories/categories.controller";
import { CategoriesUseCase } from "../../../app/usecases/categories/categories.usecase";

export const categoriesRoute = Router();

const useCase = container.get<CategoriesUseCase>('CategoriesUseCase');

categoriesRoute.post('/', async (request: Request, response: Response) => {
    const controller = new CategoriesController(useCase);

    await controller.create(request, response);
    // #swagger.tags = ['Categories']
    // #swagger.summary = 'Create a new category'
    // #swagger.description = 'Endpoint to create a category.'
    /* #swagger.requestBody = {
            required: true,
            schema: { $ref: "#/components/createCategory" }
        } 
    */
});

categoriesRoute.get('/get-by-user', async (request: Request, response: Response) => {
    const controller = new CategoriesController(useCase);

    await controller.findByUserId(request, response);
    // #swagger.tags = ['Categories']
    // #swagger.summary = 'List categories'
    // #swagger.description = 'Endpoint to list a category by userId.'
    /* #swagger.parameters['userId'] = {
            in: 'query',
            type: 'string',
            description: 'User Id',
            required: true, 
        } 
    */
    /* #swagger.responses[200] = {
            description: "List of Categories",
            schema:{ $ref: "#/definitions/getCategories" }
        }
    */
});
import { Request, Response, Router } from "express";
import { container } from "../../../app/database-injection/injection";
import { UserUseCase } from "../../../app/usecases/users/user.usecase";
import UserController from "../../../presentation/controllers/users/user.controller";

const userRoute = Router();

const useCase = container.get<UserUseCase>('UserUseCase');

userRoute.post(
    '/create', 
    async (request: Request, response: Response) => {
        const controller = new UserController(useCase);
        
        await controller.create(request, response);
        // #swagger.tags = ['Users']
        // #swagger.summary = 'Create a new user'
        // #swagger.description = 'Endpoint to create a new user.'
        /* #swagger.requestBody = {
              required: true,
              schema: { $ref: "#/components/createUser" }
           } 
        */
    }
);

userRoute.post(
    '/login', 
    async (request: Request, response: Response) => {
        const controller = new UserController(useCase);
        
        await controller.login(request, response);
        // #swagger.tags = ['Users']
        // #swagger.summary = 'Login'
        // #swagger.description = 'Endpoint to login.'
        /* #swagger.requestBody = {
              required: true,
              schema: { $ref: "#/components/loginUser" }
           } 
        */
});

export default userRoute;
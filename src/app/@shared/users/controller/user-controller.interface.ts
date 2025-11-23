import { Request, Response } from "express";

export default interface UserControllerInterface {
    create(request: Request, response: Response): Promise<Response | undefined>;
    login(request: Request, response: Response): Promise<Response | undefined>;
}


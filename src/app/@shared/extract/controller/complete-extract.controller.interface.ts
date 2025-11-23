import { Request, Response } from "express";

export interface CompleteExtractControllerInterface {
    handle(request: Request, response: Response): Promise<Response>;
    handleCardExtract(req: any, res: any): Promise<any>
}
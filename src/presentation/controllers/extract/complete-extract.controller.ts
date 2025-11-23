import { Request, Response } from "express";
import { CompleteExtractControllerInterface } from "../../../app/@shared/extract/controller/complete-extract.controller.interface";
import { CompleteExtractUseCaseInterface } from "../../../app/@shared/extract/usecase/complete-extract.usecase.interface";

export default class CompleteExtractController implements CompleteExtractControllerInterface {
  constructor(
    private useCase: CompleteExtractUseCaseInterface
    ) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { userId, month } = request.query;

    try {
      const result = await this.useCase.execute(userId as string, month as string);

      return response.status(200).json(result);
    } catch (error: any) {
      return response.status(500).json({ error: error.message });
    }
  }

  async handleCardExtract(req: any, res: any): Promise<any> {
    try {
        const cardExpensess = await this.useCase.executeCardsExtract(req.query.userId, req.query.month);

        return res.status(200).json(cardExpensess);
    } catch (error: any) {
        return res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
    }
};
}
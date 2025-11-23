import CardExpensesControllerInterface from "../../../app/@shared/card-expenses/controller/card-expenses.controller.interface";
import CardExpensesUseCaseInterface from "../../../app/@shared/card-expenses/usecase/card-expenses.usecase.interface";

export default class CardExpensesController implements CardExpensesControllerInterface {
    constructor(
        private useCase: CardExpensesUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);

            return res.status(201).json({ message: 'CardExpenses created successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async delete(req: any, res: any): Promise<any> {
        try {
            await this.useCase.delete(req.query.id);

            return res.status(200).json({ message: 'CardExpenses deleted successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };
};
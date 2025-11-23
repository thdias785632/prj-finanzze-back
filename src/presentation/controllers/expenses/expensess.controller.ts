import ExpensessControllerInterface from "../../../app/@shared/expensses/controllers/expensess.controller.interface";
import ExpensessUseCaseInterface from "../../../app/@shared/expensses/usecases/expensess.usecase.interface";

export default class ExpensessController implements ExpensessControllerInterface {
    constructor(
        private useCase: ExpensessUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);

            return res.status(201).json({ message: 'Expensess created successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async findByUserId(req: any, res: any): Promise<any> {
        try {
            const expensess = await this.useCase.findByUserId(req.query.userId);

            return res.status(200).json(expensess);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async findById(req: any, res: any): Promise<any> {
        try {
            const expenses = await this.useCase.findById(req.query.id);

            return res.status(200).json(expenses);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async delete(req: any, res: any): Promise<any> {
        try {
            await this.useCase.delete(req.query.id);

            return res.status(200).json({ message: 'Expenses deleted successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };
};
import RevenuesControllerInterface from '../../../app/@shared/revenues/controller/revenues.controller.interface';
import RevenuesUseCaseInterface from '../../../app/@shared/revenues/usecases/revenues.usecase.interface';

export default class RevenuesController implements RevenuesControllerInterface {
    constructor(
        private useCase: RevenuesUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);
            
            return res.status(201).json({ message: 'Revenue created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

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

            return res.status(200).json({ message: 'Revenue deleted successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };
}

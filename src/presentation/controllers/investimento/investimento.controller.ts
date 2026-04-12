import InvestimentoControllerInterface from '../../../app/@shared/investimento/controller/investimento.controller.interface';
import InvestimentoUseCaseInterface from '../../../app/@shared/investimento/usecases/investimento.usecase.interface';

export default class InvestimentoController implements InvestimentoControllerInterface {
    constructor(
        private useCase: InvestimentoUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);

            return res.status(201).json({ message: 'Investimento criado com sucesso' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async findByUserId(req: any, res: any): Promise<any> {
        try {
            const investimentos = await this.useCase.findByUserId(req.query.userId);

            return res.status(200).json(investimentos);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async findById(req: any, res: any): Promise<any> {
        try {
            const investimento = await this.useCase.findById(req.query.id);

            return res.status(200).json(investimento);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async update(req: any, res: any): Promise<any> {
        try {
            await this.useCase.update(req.body);

            return res.status(200).json({ message: 'Investimento atualizado com sucesso' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async delete(req: any, res: any): Promise<any> {
        try {
            await this.useCase.delete(req.query.id);

            return res.status(200).json({ message: 'Investimento deletado com sucesso' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }
}

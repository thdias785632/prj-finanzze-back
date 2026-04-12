import CategoriaInvestimentoControllerInterface from '../../../app/@shared/categoria-investimento/controller/categoria-investimento.controller.interface';
import CategoriaInvestimentoUseCaseInterface from '../../../app/@shared/categoria-investimento/usecases/categoria-investimento.usecase.interface';

export default class CategoriaInvestimentoController implements CategoriaInvestimentoControllerInterface {
    constructor(
        private useCase: CategoriaInvestimentoUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);

            return res.status(201).json({ message: 'Categoria criada com sucesso' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async findByUserId(req: any, res: any): Promise<any> {
        try {
            const categorias = await this.useCase.findByUserId(req.query.userId);

            return res.status(200).json(categorias);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async findById(req: any, res: any): Promise<any> {
        try {
            const categoria = await this.useCase.findById(req.query.id);

            return res.status(200).json(categoria);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }

    async delete(req: any, res: any): Promise<any> {
        try {
            await this.useCase.delete(req.query.id);

            return res.status(200).json({ message: 'Categoria deletada com sucesso' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    }
}

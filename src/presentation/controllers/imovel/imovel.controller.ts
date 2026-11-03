import ImovelUseCaseInterface from '../../../app/@shared/imovel/usecases/imovel.usecase.interface';

export default class ImovelController {
    constructor(
        private useCase: ImovelUseCaseInterface
    ) {}

    private fail(res: any, error: any): any {
        return res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
    }

    async create(req: any, res: any): Promise<any> {
        try {
            const { id } = await this.useCase.create(req.body);

            return res.status(201).json({ id, message: 'Imóvel criado com sucesso' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async findByUserId(req: any, res: any): Promise<any> {
        try {
            return res.status(200).json(await this.useCase.findByUserId(req.query.userId));
        } catch (error: any) { return this.fail(res, error); }
    }

    async findById(req: any, res: any): Promise<any> {
        try {
            return res.status(200).json(await this.useCase.findById(req.query.id, req.query.userId));
        } catch (error: any) { return this.fail(res, error); }
    }

    async update(req: any, res: any): Promise<any> {
        try {
            await this.useCase.update(req.body);

            return res.status(200).json({ message: 'Imóvel atualizado com sucesso' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async delete(req: any, res: any): Promise<any> {
        try {
            await this.useCase.delete(req.query.id, req.query.userId);

            return res.status(200).json({ message: 'Imóvel removido com sucesso' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async addFluxo(req: any, res: any): Promise<any> {
        try {
            const { id } = await this.useCase.addFluxo(req.body);

            return res.status(201).json({ id, message: 'Fluxo adicionado com sucesso' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async deleteFluxo(req: any, res: any): Promise<any> {
        try {
            await this.useCase.deleteFluxo(req.query.id, req.query.userId);

            return res.status(200).json({ message: 'Fluxo removido com sucesso' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async payParcela(req: any, res: any): Promise<any> {
        try {
            await this.useCase.payParcela(req.body);

            return res.status(200).json({ message: 'Parcela marcada como paga' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async unpayParcela(req: any, res: any): Promise<any> {
        try {
            await this.useCase.unpayParcela(req.body.id, req.body.userId);

            return res.status(200).json({ message: 'Pagamento desfeito' });
        } catch (error: any) { return this.fail(res, error); }
    }

    async updateParcela(req: any, res: any): Promise<any> {
        try {
            await this.useCase.updateParcela(req.body);

            return res.status(200).json({ message: 'Parcela atualizada' });
        } catch (error: any) { return this.fail(res, error); }
    }
}

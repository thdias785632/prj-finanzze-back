import { IndiceUseCaseInterface } from '../../../app/@shared/indice/usecases/indice.usecase.interface';

export default class IndiceController {
    constructor(
        private useCase: IndiceUseCaseInterface
    ) {}

    private fail(res: any, error: any): any {
        return res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
    }

    // GET /api/indices/incc?from=YYYY-MM&to=YYYY-MM
    async listIncc(req: any, res: any): Promise<any> {
        try {
            return res.status(200).json(await this.useCase.listIncc(req.query.from, req.query.to));
        } catch (error: any) { return this.fail(res, error); }
    }

    // POST /api/indices/incc/sync { from?: 'YYYY-MM' }  -> busca no Banco Central
    async syncIncc(req: any, res: any): Promise<any> {
        try {
            return res.status(200).json(await this.useCase.syncIncc(req.body?.from));
        } catch (error: any) { return this.fail(res, error); }
    }

    // PUT /api/indices/incc { month: 'YYYY-MM', variation: 0.53 } -> informar manualmente
    async setIncc(req: any, res: any): Promise<any> {
        try {
            await this.useCase.setInccManual(req.body?.month, req.body?.variation);

            return res.status(200).json({ message: 'INCC informado com sucesso' });
        } catch (error: any) { return this.fail(res, error); }
    }
}

export default interface CategoriaInvestimentoControllerInterface {
    create(req: any, res: any): Promise<any>;
    findByUserId(req: any, res: any): Promise<any>;
    findById(req: any, res: any): Promise<any>;
    delete(req: any, res: any): Promise<any>;
}

export default interface InvestimentoControllerInterface {
    create(req: any, res: any): Promise<any>;
    findByUserId(req: any, res: any): Promise<any>;
    findById(req: any, res: any): Promise<any>;
    update(req: any, res: any): Promise<any>;
    delete(req: any, res: any): Promise<any>;
}

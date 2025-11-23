export default interface RevenuesControllerInterface {
    create(request: Request, response: Response): Promise<Response | undefined>;
    findByUserId(request: Request, response: Response): Promise<Response | undefined>;
    findById(request: Request, response: Response): Promise<Response | undefined>;
    delete(request: Request, response: Response): Promise<Response | undefined>;
}
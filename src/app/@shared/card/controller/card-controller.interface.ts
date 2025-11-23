export default interface CardControllerInterface {
    create(request: Request, response: Response): Promise<Response | undefined>;
    findByUserId(request: Request, response: Response): Promise<Response | undefined>;
    findById(request: Request, response: Response): Promise<Response | undefined>;
    update(request: Request, response: Response): Promise<Response | undefined>;
}
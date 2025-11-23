export default interface CategoriesControllerInterface {
    create(request: Request, response: Response): Promise<Response | undefined>;
    findByUserId(request: Request, response: Response): Promise<Response | undefined>;
}
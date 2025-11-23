export default interface CardExpensesControllerInterface {
    create(request: Request, response: Response): Promise<Response | undefined>;
    delete(request: Request, response: Response): Promise<Response | undefined>;
}
import CategoriesControllerInterface from "../../../app/@shared/categories/controller/categories-controller.interface";
import CategoriesUseCaseInterface from "../../../app/@shared/categories/usecases/categories.usecase.interface";

export default class CategoriesController implements CategoriesControllerInterface {
    constructor(
        private useCase: CategoriesUseCaseInterface
    ) {}

    async create(req: any, res: any): Promise<any> {
        try {
            await this.useCase.create(req.body);

            return res.status(201).json({ message: 'Category created successfully' });
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };

    async findByUserId(req: any, res: any): Promise<any> {
        try {
            const categories = await this.useCase.findByUserId(req.query.userId);

            return res.status(200).json(categories);
        } catch (error: any) {
            res.status(error.status ? error.status : 500).json({ message: error.message ? error.message : 'Internal Server Error' });
        }
    };
};
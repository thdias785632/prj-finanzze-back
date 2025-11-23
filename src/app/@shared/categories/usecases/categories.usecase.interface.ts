import { CategoriesDto } from "../../../../domain/categories/dto/categories.dto";

export default interface CategoriesUseCaseInterface {
    create(input: inputCreateCategory): Promise<void>
    findByUserId(userId: string): Promise<CategoriesDto[]>
}

export interface inputCreateCategory {
    userId: string;
    name: string;
}
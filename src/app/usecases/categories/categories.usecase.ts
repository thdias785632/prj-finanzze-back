import { injectable } from "inversify";
import { inject } from "inversify";
import { randomUUID } from "crypto";
import CategoriesUseCaseInterface, { inputCreateCategory } from "../../@shared/categories/usecases/categories.usecase.interface";
import { CategoriesRepositoryInterface } from "../../@shared/categories/repository/categories-repository.interface";
import { CategoriesDto } from "../../../domain/categories/dto/categories.dto";

@injectable()
export class CategoriesUseCase implements CategoriesUseCaseInterface {
    constructor(
        @inject('CategoriesRepository')
        private categoriesRepository: CategoriesRepositoryInterface
    ) {}
    
    async create(input: inputCreateCategory): Promise<void> {
        const category: CategoriesDto = {
            id: randomUUID(),
            userId: input.userId,
            name: input.name,
        };

        await this.categoriesRepository.create(category);
    }

    async findByUserId(userId: string): Promise<CategoriesDto[]> {
        const categories  = await this.categoriesRepository.findByUserId(userId);

        return categories || [];
    }
}
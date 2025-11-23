import { CategoriesDto } from "../../../../domain/categories/dto/categories.dto"

export interface CategoriesRepositoryInterface {
    create(card: CategoriesDto): Promise<void>
    findByUserId(userId: string): Promise<CategoriesDto[] | undefined>
}
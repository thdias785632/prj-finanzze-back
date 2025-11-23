import { ExpensessDTO } from "../../../../domain/expensess/dto/expensess.dto"

export interface ExpensessRepositoryInterface {
    create(expensess: ExpensessDTO): Promise<void>
    findByUserId(userId: string): Promise<ExpensessDTO[]>
    findById(id: string): Promise<ExpensessDTO | undefined>
    delete(id: string): Promise<void>
}
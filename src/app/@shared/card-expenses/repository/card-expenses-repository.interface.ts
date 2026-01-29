import { CardExpensesDto } from "../../../../domain/card-expenses/dto/card-expenses.dto"

export interface CardExpensesRepositoryInterface {
    create(card: CardExpensesDto): Promise<void>
    update(card: CardExpensesDto): Promise<void>
    findByUserId(userId: string): Promise<CardExpensesDto[]>
    findByCardId(cardId: string): Promise<CardExpensesDto[]>
    delete(id: string): Promise<void>
}
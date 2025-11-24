import { CardDto } from "../../../../domain/card/dto/card.dto"

export interface CardRepositoryInterface {
    create(card: CardDto): Promise<void>
    findByUserId(userId: string): Promise<CardDto[]>
    findById(id: string): Promise<CardDto | undefined>
    update(card: CardDto): Promise<void>
}
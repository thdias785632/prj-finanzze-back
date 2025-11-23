import { CardDto } from "../../../../domain/card/dto/card.dto";

export default interface CardUseCaseInterface {
    create(input: inputCreateCard): Promise<void>
    findByUserId(userId: string): Promise<CardDto[] | Error>
    findById(id: string): Promise<CardDto | Error>
    update(card: CardDto): Promise<void>
}

export interface inputCreateCard {
    userId: string;
    name: string;
    active: boolean;
    flag: string;
}

export interface inputUpdateCard {
    id: string;
    userId: string;
    name: string;
    active: boolean;
    flag: string;
}
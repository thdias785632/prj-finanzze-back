import { injectable } from "inversify";
import CardUseCaseInterface, { inputCreateCard, inputUpdateCard } from "../../@shared/card/usecases/card.usecase.interface";
import { inject } from "inversify";
import { CardRepositoryInterface } from "../../@shared/card/repository/card-repository.interface";
import { CardDto } from "../../../domain/card/dto/card.dto";
import { randomUUID } from "crypto";

@injectable()
export class CardUseCase implements CardUseCaseInterface {
    constructor(
        @inject('CardRepository')
        private cardRepository: CardRepositoryInterface
    ) {}
    
    async create(input: inputCreateCard): Promise<void> {
        const card: CardDto = {
            id: randomUUID(),
            userId: input.userId,
            name: input.name,
            active: input.active,
            flag: input.flag
        };

        await this.cardRepository.create(card);
    }

    async findByUserId(userId: string): Promise<CardDto[]> {
        const cards  = await this.cardRepository.findByUserId(userId);

        return cards;
    }

    async findById(id: string): Promise<any | Error> {
        const card = await this.cardRepository.findById(id);

        if (!card) {
            throw new Error('Card not found');
        };

        return card;
    }

    async update(card: inputUpdateCard): Promise<void> {
        const cardDto: CardDto = {
            id: card.id,
            userId: card.userId,
            name: card.name,
            active: card.active,
            flag: card.flag
        };

        await this.cardRepository.update(cardDto);
    }
}
import { injectable } from "inversify";
import { inject } from "inversify";
import { randomUUID } from "crypto";
import CardExpensesUseCaseInterface, { inputCreateCardExpenses, inputUpdateCardExpenses } from "../../@shared/card-expenses/usecase/card-expenses.usecase.interface";
import { CardExpensesRepositoryInterface } from "../../@shared/card-expenses/repository/card-expenses-repository.interface";
import { CardExpensesDto, CardExtractDto } from "../../../domain/card-expenses/dto/card-expenses.dto";
import { format } from "date-fns";

@injectable()
export class CardExpensesUseCase implements CardExpensesUseCaseInterface {
    constructor(
        @inject('CardExpensesRepository')
        private cardExpensesRepository: CardExpensesRepositoryInterface
    ) {}
    
    async create(input: inputCreateCardExpenses): Promise<void> {
        const cardExpenses: CardExpensesDto = {
            id: randomUUID(),
            cardId: input.cardId,
            userId: input.userId,
            name: input.name,
            value: input.value,
            installments: input.installments,
            category: input.category,
            referenceDate: input.referenceDate,
            recurrent: input.recurrent,
            active: input.active,
            createdAt: new Date()
        };

        await this.cardExpensesRepository.create(cardExpenses);
    }

    async update(input: inputUpdateCardExpenses): Promise<void> {
        const cardExpenses: CardExpensesDto = {
            id: input.id,
            cardId: input.cardId,
            userId: input.userId,
            name: input.name,
            value: input.value,
            installments: input.installments,
            category: input.category,
            referenceDate: input.referenceDate,
            recurrent: input.recurrent,
            active: input.active,
            updatedAt: new Date()
        };

        await this.cardExpensesRepository.update(cardExpenses);
    }

    async delete(id: string): Promise<void> {
        await this.cardExpensesRepository.delete(id);
    }
}
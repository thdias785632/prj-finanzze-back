import { injectable } from "inversify";
import { inject } from "inversify";
import { randomUUID } from "crypto";
import ExpensessUseCaseInterface, { inputCreateExpensess, inputUpdateExpensess } from "../../@shared/expensses/usecases/expensess.usecase.interface";
import { ExpensessRepositoryInterface } from "../../@shared/expensses/repositories/expensess.repository.interface";
import { ExpensessDTO } from "../../../domain/expensess/dto/expensess.dto";

@injectable()
export default class ExpensessUseCase implements ExpensessUseCaseInterface {
    constructor(
        @inject("ExpensessRepository")
        private expensessRepository: ExpensessRepositoryInterface,
    ) {}

    async create(input: inputCreateExpensess): Promise<void> {
        const expenses: ExpensessDTO = {
            id: randomUUID(),
            userId: input.userId,
            name: input.name,
            value: input.value,
            referenceDate: input.referenceDate,
            active: input.active,
            recurrent: input.recurrent,
            category: input.category,
            createdAt: new Date()
        };

        await this.expensessRepository.create(expenses);
    }

    async update(input: inputUpdateExpensess): Promise<void> {
        const expenses: ExpensessDTO = {
            id: input.id,
            userId: input.userId,
            name: input.name,
            value: input.value,
            referenceDate: input.referenceDate,
            active: input.active,
            recurrent: input.recurrent,
            category: input.category,
            updatedAt: new Date()
        };
     
        await this.expensessRepository.update(expenses);
    }

    async findByUserId(userId: string): Promise<ExpensessDTO[]> {
        const expensess = await this.expensessRepository.findByUserId(userId);

        return expensess;
    }

    async findById(id: string): Promise<ExpensessDTO | Error> {
        const expenses = await this.expensessRepository.findById(id);

        if (!expenses) {
            throw new Error('Expenses not found');
        };

        return expenses;
    }

    async delete(id: string): Promise<void> {
        await this.expensessRepository.delete(id);
    }
}
import { inject } from 'inversify';
import { RevenuesDTO } from '../../../domain/revenues/dto/revenues.dto';
import { injectable } from 'inversify';
import RevenuesUseCaseInterface, { inputCreateRevenues, inputUpdateRevenues } from '../../@shared/revenues/usecases/revenues.usecase.interface';
import { randomUUID } from 'crypto';
import { RevenuesRepositoryInterface } from '../../@shared/revenues/repositories/revenues.repository.interface';

@injectable()
export default class RevenuesUseCase implements RevenuesUseCaseInterface {
    constructor(
        @inject("RevenuesRepository")
        private revenuesRepository: RevenuesRepositoryInterface
    ) {}

    async create(input: inputCreateRevenues): Promise<void> {
            const expenses: RevenuesDTO = {
                id: randomUUID(),
                userId: input.userId,
                name: input.name,
                value: input.value,
                referenceDate: input.referenceDate,
                active: input.active,
                recurrent: input.recurrent,
                createdAt: new Date()
            };
    
            await this.revenuesRepository.create(expenses);
        }
    
        async findByUserId(userId: string): Promise<RevenuesDTO[]> {
            const Revenues = await this.revenuesRepository.findByUserId(userId);
    
            return Revenues;
        }
    
        async findById(id: string): Promise<RevenuesDTO | Error> {
            const expenses = await this.revenuesRepository.findById(id);
    
            if (!expenses) {
                throw new Error('Revenue not found');
            };
    
            return expenses;
        }
    
        async delete(id: string): Promise<void> {
            await this.revenuesRepository.delete(id);
        }
}

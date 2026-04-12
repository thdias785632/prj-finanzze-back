import { inject, injectable } from 'inversify';
import { randomUUID } from 'crypto';
import { InvestimentoDTO } from '../../../domain/investimento/dto/investimento.dto';
import InvestimentoUseCaseInterface, { inputCreateInvestimento, inputUpdateInvestimento } from '../../@shared/investimento/usecases/investimento.usecase.interface';
import { InvestimentoRepositoryInterface } from '../../@shared/investimento/repository/investimento.repository.interface';

@injectable()
export class InvestimentoUseCase implements InvestimentoUseCaseInterface {
    constructor(
        @inject('InvestimentoRepository')
        private investimentoRepository: InvestimentoRepositoryInterface
    ) {}

    async create(input: inputCreateInvestimento): Promise<void> {
        // Se quantidade e preço atual foram informados, recalcula o valor atual
        const currentValue = (input.quantity && input.currentPrice)
            ? input.quantity * input.currentPrice
            : input.currentValue;

        const investimento: InvestimentoDTO = {
            id: randomUUID(),
            userId: input.userId,
            categoriaId: input.categoriaId,
            name: input.name,
            currentValue,
            targetPercentage: input.targetPercentage,
            quantity: input.quantity ?? undefined,
            averagePrice: input.averagePrice ?? undefined,
            currentPrice: input.currentPrice ?? undefined,
            createdAt: new Date()
        };

        await this.investimentoRepository.create(investimento);
    }

    async findByUserId(userId: string): Promise<InvestimentoDTO[]> {
        return await this.investimentoRepository.findByUserId(userId);
    }

    async findById(id: string): Promise<InvestimentoDTO | Error> {
        const investimento = await this.investimentoRepository.findById(id);

        if (!investimento) {
            throw new Error('Investimento não encontrado');
        }

        return investimento;
    }

    async update(input: inputUpdateInvestimento): Promise<void> {
        const currentValue = (input.quantity && input.currentPrice)
            ? input.quantity * input.currentPrice
            : input.currentValue;

        const investimento: InvestimentoDTO = {
            id: input.id,
            userId: input.userId,
            categoriaId: input.categoriaId,
            name: input.name,
            currentValue,
            targetPercentage: input.targetPercentage,
            quantity: input.quantity ?? undefined,
            averagePrice: input.averagePrice ?? undefined,
            currentPrice: input.currentPrice ?? undefined,
        };

        await this.investimentoRepository.update(investimento);
    }

    async delete(id: string): Promise<void> {
        await this.investimentoRepository.delete(id);
    }
}

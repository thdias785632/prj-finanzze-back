import { inject, injectable } from 'inversify';
import { randomUUID } from 'crypto';
import { CategoriaInvestimentoDTO } from '../../../domain/categoria-investimento/dto/categoria-investimento.dto';
import CategoriaInvestimentoUseCaseInterface, { inputCreateCategoriaInvestimento } from '../../@shared/categoria-investimento/usecases/categoria-investimento.usecase.interface';
import { CategoriaInvestimentoRepositoryInterface } from '../../@shared/categoria-investimento/repository/categoria-investimento.repository.interface';

@injectable()
export class CategoriaInvestimentoUseCase implements CategoriaInvestimentoUseCaseInterface {
    constructor(
        @inject('CategoriaInvestimentoRepository')
        private categoriaRepository: CategoriaInvestimentoRepositoryInterface
    ) {}

    async create(input: inputCreateCategoriaInvestimento): Promise<void> {
        const categoria: CategoriaInvestimentoDTO = {
            id: randomUUID(),
            userId: input.userId,
            name: input.name,
            targetPercentage: input.targetPercentage,
            createdAt: new Date()
        };

        await this.categoriaRepository.create(categoria);
    }

    async findByUserId(userId: string): Promise<CategoriaInvestimentoDTO[]> {
        return await this.categoriaRepository.findByUserId(userId);
    }

    async findById(id: string): Promise<CategoriaInvestimentoDTO | Error> {
        const categoria = await this.categoriaRepository.findById(id);

        if (!categoria) {
            throw new Error('Categoria de investimento não encontrada');
        }

        return categoria;
    }

    async delete(id: string): Promise<void> {
        await this.categoriaRepository.delete(id);
    }
}

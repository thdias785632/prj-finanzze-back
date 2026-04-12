import { CategoriaInvestimentoDTO } from "../../../../domain/categoria-investimento/dto/categoria-investimento.dto";

export interface CategoriaInvestimentoRepositoryInterface {
    create(categoria: CategoriaInvestimentoDTO): Promise<void>;
    findByUserId(userId: string): Promise<CategoriaInvestimentoDTO[]>;
    findById(id: string): Promise<CategoriaInvestimentoDTO | undefined>;
    delete(id: string): Promise<void>;
}

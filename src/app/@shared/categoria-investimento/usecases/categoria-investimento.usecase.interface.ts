import { CategoriaInvestimentoDTO } from "../../../../domain/categoria-investimento/dto/categoria-investimento.dto";

export default interface CategoriaInvestimentoUseCaseInterface {
    create(input: inputCreateCategoriaInvestimento): Promise<void>;
    findByUserId(userId: string): Promise<CategoriaInvestimentoDTO[]>;
    findById(id: string): Promise<CategoriaInvestimentoDTO | Error>;
    delete(id: string): Promise<void>;
}

export interface inputCreateCategoriaInvestimento {
    userId: string;
    name: string;
    targetPercentage: number;
}

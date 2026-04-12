import { InvestimentoDTO } from "../../../../domain/investimento/dto/investimento.dto";

export default interface InvestimentoUseCaseInterface {
    create(input: inputCreateInvestimento): Promise<void>;
    findByUserId(userId: string): Promise<InvestimentoDTO[]>;
    findById(id: string): Promise<InvestimentoDTO | Error>;
    update(input: inputUpdateInvestimento): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface inputCreateInvestimento {
    userId: string;
    categoriaId: string;
    name: string;
    currentValue: number;
    targetPercentage: number;
    quantity?: number;
    averagePrice?: number;
    currentPrice?: number;
}

export interface inputUpdateInvestimento {
    id: string;
    userId: string;
    categoriaId: string;
    name: string;
    currentValue: number;
    targetPercentage: number;
    quantity?: number;
    averagePrice?: number;
    currentPrice?: number;
}

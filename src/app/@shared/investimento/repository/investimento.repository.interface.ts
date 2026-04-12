import { InvestimentoDTO } from "../../../../domain/investimento/dto/investimento.dto";

export interface InvestimentoRepositoryInterface {
    create(investimento: InvestimentoDTO): Promise<void>;
    findByUserId(userId: string): Promise<InvestimentoDTO[]>;
    findById(id: string): Promise<InvestimentoDTO | undefined>;
    update(investimento: InvestimentoDTO): Promise<void>;
    delete(id: string): Promise<void>;
}

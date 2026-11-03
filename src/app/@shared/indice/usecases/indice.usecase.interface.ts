import { IndiceEconomicoDTO } from "../../../../domain/imovel/dto/imovel.dto";
import { VariationMap } from "../../../usecases/imovel/incc-calculator";

export interface IndiceUseCaseInterface {
    // Busca o INCC no Banco Central (SGS 192) a partir de `fromYm` (YYYY-MM) e grava no banco.
    syncIncc(fromYm?: string): Promise<{ fetched: number; from: string }>;
    // Garante que o histórico cobre o mês-base do contrato (busca no BCB se necessário). Nunca lança.
    ensureInccCoverage(baseYm: string): Promise<void>;
    getInccVariations(): Promise<VariationMap>;
    listIncc(fromYm?: string, toYm?: string): Promise<IndiceEconomicoDTO[]>;
    setInccManual(month: string, variation: number): Promise<void>;
}

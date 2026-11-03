import { IndiceEconomicoDTO } from "../../../../domain/imovel/dto/imovel.dto";

export interface IndiceRepositoryInterface {
    // Insere/atualiza; linhas com source = MANUAL não são sobrescritas por valores do BCB.
    upsertMany(series: string, rows: { refMonth: string; variation: number }[], source: 'BCB' | 'MANUAL'): Promise<void>;
    findAll(series: string): Promise<IndiceEconomicoDTO[]>;
    findRange(series: string, fromYm?: string, toYm?: string): Promise<IndiceEconomicoDTO[]>;
}

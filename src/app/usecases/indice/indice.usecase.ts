import { injectable, inject } from "inversify";
import { IndiceUseCaseInterface } from "../../@shared/indice/usecases/indice.usecase.interface";
import { IndiceRepositoryInterface } from "../../@shared/indice/repository/indice.repository.interface";
import { IndiceEconomicoDTO } from "../../../domain/imovel/dto/imovel.dto";
import { BcbClient } from "../../../infra/api/bcb/bcb-client";
import { addMonthsYm, VariationMap } from "../imovel/incc-calculator";

const INCC = 'INCC';
const INCC_SGS_CODE = 192;

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

@injectable()
export class IndiceUseCase implements IndiceUseCaseInterface {
    bcb = new BcbClient();

    constructor(
        @inject('IndiceRepository')
        private indiceRepository: IndiceRepositoryInterface
    ) {}

    private currentYm(): string {
        return new Date().toISOString().slice(0, 7);
    }

    async syncIncc(fromYm?: string): Promise<{ fetched: number; from: string }> {
        // padrão: últimos 24 meses (cobre a defasagem e correções recentes). Limite do BCB: 10 anos por consulta.
        const oldestAllowed = addMonthsYm(this.currentYm(), -119);
        let from = fromYm || addMonthsYm(this.currentYm(), -24);

        if (from < oldestAllowed) from = oldestAllowed;

        const points = await this.bcb.fetchMonthlySeries(INCC_SGS_CODE, from);

        await this.indiceRepository.upsertMany(INCC, points, 'BCB');

        console.log(`[indices] INCC sincronizado: ${points.length} meses a partir de ${from}`);

        return { fetched: points.length, from };
    }

    async ensureInccCoverage(baseYm: string): Promise<void> {
        try {
            const rows = await this.indiceRepository.findRange(INCC);
            const earliest = rows[0]?.refMonth;

            if (!earliest || earliest > addMonthsYm(baseYm, 1)) {
                await this.syncIncc(baseYm);
            }
        } catch (error) {
            // Sem o BCB o imóvel continua funcionando: parcelas ficam "estimadas" até o índice chegar
            // (o job diário tenta de novo; também dá para informar o mês manualmente).
            console.error('[indices] Não foi possível sincronizar o INCC agora:', error);
        }
    }

    async getInccVariations(): Promise<VariationMap> {
        const rows = await this.indiceRepository.findAll(INCC);

        return new Map(rows.map((row) => [row.refMonth, row.variation]));
    }

    async listIncc(fromYm?: string, toYm?: string): Promise<IndiceEconomicoDTO[]> {
        return this.indiceRepository.findRange(INCC, fromYm, toYm);
    }

    async setInccManual(month: string, variation: number): Promise<void> {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'month deve estar no formato YYYY-MM');
        if (typeof variation !== 'number' || !Number.isFinite(variation) || Math.abs(variation) > 50) {
            throw new HttpError(400, 'variation deve ser um número (percentual do mês), ex.: 0.53');
        }

        await this.indiceRepository.upsertMany(INCC, [{ refMonth: month, variation }], 'MANUAL');
    }
}

export type VariationMap = Map<string, number>;

export function toYm(date: string): string {
    return date.slice(0, 7);
}

export function addMonthsYm(ym: string, months: number): string {
    const [year, month] = ym.split('-').map(Number);
    const total = year * 12 + (month - 1) + months;

    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export function addMonthsDate(date: string, months: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const ym = addMonthsYm(`${year}-${String(month).padStart(2, '0')}`, months);
    const [y, m] = ym.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();

    return `${ym}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

export function isValidDate(date: unknown): date is string {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const [y, m, d] = date.split('-').map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));

    return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface IndexFactor {
    factor: number;              // fator acumulado (1 = sem correção)
    estimated: boolean;          // true quando algum mês do período não foi divulgado (projetado ou sem base para projetar)
    lastMonthApplied?: string;   // último mês divulgado efetivamente aplicado
    projectedMonths: number;     // quantos meses foram preenchidos com a média do ano
    projectedVariation?: number; // média mensal (%) usada nesses meses
    projectedYear?: number;      // ano cuja média foi usada
}

export interface Projection {
    variation: number;           // média mensal (%) usada como projeção
    year: number;                // ano da média
}

export type Projector = (ym: string) => Projection | undefined;

/**
 * Projeção para meses ainda não divulgados: média aritmética das variações mensais do INCC do ano do
 * último mês divulgado, de janeiro até esse mês. Ex.: divulgado até 2026-09 → média de jan–set/2026,
 * aplicada a out/2026, nov/2026, ... (inclusive em anos seguintes, pois ainda não há dado deles).
 * Se houver "buraco" no meio da série, usa o último mês divulgado antes do mês faltante.
 * Retorna undefined quando não existe nenhum mês divulgado antes (sem base para estimar).
 */
export function buildProjector(variations: VariationMap): Projector {
    const published = [...variations.keys()].sort();
    const memo = new Map<string, Projection>();

    return (ym: string) => {
        let lastBefore: string | undefined;

        for (const month of published) {
            if (month < ym) lastBefore = month;
            else break;
        }

        if (!lastBefore) return undefined;

        const cached = memo.get(lastBefore);

        if (cached) return cached;

        const year = lastBefore.slice(0, 4);
        const values = published
            .filter((month) => month.startsWith(year) && month <= (lastBefore as string))
            .map((month) => variations.get(month) as number);

        const projection: Projection = {
            variation: values.reduce((sum, value) => sum + value, 0) / values.length,
            year: Number(year)
        };

        memo.set(lastBefore, projection);

        return projection;
    };
}

/**
 * Fator acumulado do índice do mês-base (inclusive) até o mês de referência (inclusive).
 * Meses não divulgados usam a projeção (média do ano) quando `project` é informado; nesse caso o
 * resultado vem com `estimated: true`. Sem projeção possível, acumula até onde há dado.
 */
export function computeIndexFactor(baseYm: string, referenceYm: string, variations: VariationMap, project?: Projector): IndexFactor {
    let factor = 1;
    let last: string | undefined;
    let projectedMonths = 0;
    let projection: Projection | undefined;

    for (let ym = baseYm; ym <= referenceYm; ym = addMonthsYm(ym, 1)) {
        let variation = variations.get(ym);

        if (variation === undefined) {
            const estimate = project?.(ym);

            if (!estimate) {
                return { factor, estimated: true, lastMonthApplied: last, projectedMonths, projectedVariation: projection?.variation, projectedYear: projection?.year };
            }

            variation = estimate.variation;
            projection = estimate;
            projectedMonths++;
        } else {
            last = ym;
        }

        factor *= 1 + variation / 100;
    }

    return {
        factor,
        estimated: projectedMonths > 0,
        lastMonthApplied: last,
        projectedMonths,
        projectedVariation: projection?.variation,
        projectedYear: projection?.year
    };
}

export function referenceMonthFor(dueDate: string, lagMonths: number): string {
    return addMonthsYm(toYm(dueDate), -lagMonths);
}

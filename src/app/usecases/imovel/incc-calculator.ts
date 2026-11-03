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
    estimated: boolean;          // faltam meses publicados entre o mês-base e o mês de referência
    lastMonthApplied?: string;   // último mês efetivamente aplicado
}

export function computeIndexFactor(baseYm: string, referenceYm: string, variations: VariationMap): IndexFactor {
    if (referenceYm <= baseYm) return { factor: 1, estimated: false };

    let factor = 1;
    let last: string | undefined;

    for (let ym = addMonthsYm(baseYm, 1); ym <= referenceYm; ym = addMonthsYm(ym, 1)) {
        const variation = variations.get(ym);

        if (variation === undefined) {
            return { factor, estimated: true, lastMonthApplied: last };
        }

        factor *= 1 + variation / 100;
        last = ym;
    }

    return { factor, estimated: false, lastMonthApplied: last };
}

export function referenceMonthFor(dueDate: string, lagMonths: number): string {
    return addMonthsYm(toYm(dueDate), -lagMonths);
}

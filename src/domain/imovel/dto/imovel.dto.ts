export const FLUXO_TIPOS = ['ENTRADA', 'MENSAIS', 'INTERMEDIARIAS', 'CHAVES', 'FINANCIAMENTO', 'OUTRO'] as const;
export type FluxoTipo = typeof FLUXO_TIPOS[number];

export const INDEX_TYPES = ['INCC', 'NONE'] as const;
export type IndexType = typeof INDEX_TYPES[number];

// Datas trafegam como string ISO "YYYY-MM-DD" (evita problemas de fuso horário).
export interface ImovelDTO {
    id: string;
    userId: string;
    name: string;
    developer?: string;
    address?: string;
    totalValue: number;
    contractDate: string;
    inccBaseMonth: string;      // YYYY-MM-01
    inccLagMonths: number;      // 0..12
    deliveryDate?: string;
    financingStartDate?: string;
    notes?: string;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ImovelFluxoDTO {
    id: string;
    imovelId: string;
    userId: string;
    type: FluxoTipo;
    description: string;
    installmentsCount: number;
    installmentAmount: number;
    firstDueDate: string;
    periodicityMonths: number;
    indexType: IndexType;
    createdAt?: Date;
}

export interface ImovelParcelaDTO {
    id: string;
    imovelId: string;
    fluxoId: string;
    userId: string;
    number: number;
    dueDate: string;
    baseAmount: number;
    paid: boolean;
    paidAt?: string;
    paidAmount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ImovelParcelaCalculadaDTO extends ImovelParcelaDTO {
    fluxoType: FluxoTipo;
    fluxoDescription: string;
    totalNumbers: number;
    indexType: IndexType;
    referenceMonth?: string;      // mês do INCC usado (YYYY-MM): vencimento - defasagem
    correctionFactor: number;     // fator acumulado desde o mês-base
    correctedAmount: number;      // base * fator
    estimated: boolean;           // true = ainda faltam meses de INCC publicados (valor parcial)
    currentAmount: number;        // pago -> valor pago; em aberto -> valor corrigido
    overdue: boolean;
}

export interface ImovelFluxoDetalheDTO extends ImovelFluxoDTO {
    parcelas: ImovelParcelaCalculadaDTO[];
    paidCount: number;
    totalPaid: number;
    totalRemaining: number;
}

export interface ImovelResumoDTO extends ImovelDTO {
    plannedTotal: number;          // soma dos valores-base de todas as parcelas
    totalPaid: number;
    totalRemaining: number;        // parcelas em aberto, já corrigidas
    paidInstallments: number;
    totalInstallments: number;
    progressPercentage: number;    // pago / (pago + restante)
    financingAmount: number;       // parcelas em aberto do tipo FINANCIAMENTO
    overdueCount: number;
    nextInstallment?: ImovelParcelaCalculadaDTO;
    lastIndexMonth?: string;       // último mês de INCC disponível (YYYY-MM)
}

export interface ImovelDetalheDTO {
    imovel: ImovelResumoDTO;
    fluxos: ImovelFluxoDetalheDTO[];
}

export interface IndiceEconomicoDTO {
    series: string;
    refMonth: string;   // YYYY-MM
    variation: number;
    source: string;
}

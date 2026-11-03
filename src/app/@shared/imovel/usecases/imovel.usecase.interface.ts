import { FluxoTipo, ImovelDetalheDTO, ImovelResumoDTO, IndexType } from "../../../../domain/imovel/dto/imovel.dto";

export interface inputFluxo {
    type: FluxoTipo;
    description?: string;
    installmentsCount: number;
    installmentAmount: number;
    firstDueDate: string;           // YYYY-MM-DD
    periodicityMonths?: number;     // padrão 1
    indexType?: IndexType;          // padrão INCC (FINANCIAMENTO: NONE)
}

export interface inputCreateImovel {
    userId: string;
    name: string;
    developer?: string;
    address?: string;
    totalValue: number;
    contractDate: string;           // YYYY-MM-DD
    inccBaseMonth?: string;         // YYYY-MM ou YYYY-MM-DD (padrão: mês do contrato)
    inccLagMonths?: number;         // 0..12 (padrão 2)
    deliveryDate?: string;
    financingStartDate?: string;
    notes?: string;
    fluxos: inputFluxo[];
}

export interface inputUpdateImovel {
    id: string;
    userId: string;
    name?: string;
    developer?: string;
    address?: string;
    totalValue?: number;
    inccBaseMonth?: string;
    inccLagMonths?: number;
    deliveryDate?: string | null;
    financingStartDate?: string | null;
    notes?: string;
    active?: boolean;
}

export interface inputAddFluxo extends inputFluxo {
    imovelId: string;
    userId: string;
}

export interface inputPayParcela {
    id: string;
    userId: string;
    paidAt?: string;
    paidAmount?: number;
}

export interface inputUpdateParcela {
    id: string;
    userId: string;
    baseAmount?: number;
    dueDate?: string;
}

export default interface ImovelUseCaseInterface {
    create(input: inputCreateImovel): Promise<{ id: string }>;
    findByUserId(userId: string): Promise<ImovelResumoDTO[]>;
    findById(id: string, userId: string): Promise<ImovelDetalheDTO>;
    update(input: inputUpdateImovel): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
    addFluxo(input: inputAddFluxo): Promise<{ id: string }>;
    deleteFluxo(id: string, userId: string): Promise<void>;
    payParcela(input: inputPayParcela): Promise<void>;
    unpayParcela(id: string, userId: string): Promise<void>;
    updateParcela(input: inputUpdateParcela): Promise<void>;
}

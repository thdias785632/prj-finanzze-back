export interface InvestimentoDTO {
    id: string;
    userId: string;
    categoriaId: string;
    name: string;
    currentValue: number;
    targetPercentage: number;
    quantity?: number;
    averagePrice?: number;
    currentPrice?: number;
    createdAt?: Date;
}

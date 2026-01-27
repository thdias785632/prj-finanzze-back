export interface CompleteExtractDTO {
    totalExpensess: number;
    totalCardExpensess: number;
    totalRevenues: number;
    revenues: Omit<Itens, 'category'>[];
    cardExpensess: Itens[];
    fixedExpensess: Itens[];
}

export interface Itens {
    id: string;
    name: string;
    value: number;
    category: string;
    referenceDate: Date;
    active: boolean;
    installments?: number;
    recurrent: boolean;
    cardId?: string;
}
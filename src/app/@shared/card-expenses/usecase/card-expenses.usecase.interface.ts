export default interface CardExpensesUseCaseInterface {
    create(input: inputCreateCardExpenses): Promise<void>
    update(input: inputUpdateCardExpenses): Promise<void>
    delete(id: string): Promise<void>
}

export interface inputCreateCardExpenses {
    cardId: string;
    userId: string;
    name: string;
    value: number;
    installments?: number
    referenceDate: Date;
    category: string;
    active: boolean;
    recurrent: boolean;
}

export interface inputUpdateCardExpenses {
    id: string;
    cardId: string;
    userId: string;
    name: string;
    value: number;
    installments: number
    referenceDate: Date;
    category: string;
    active: boolean;
    recurrent: boolean;
}
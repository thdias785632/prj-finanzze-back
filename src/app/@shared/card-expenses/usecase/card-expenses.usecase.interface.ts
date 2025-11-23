export default interface CardExpensesUseCaseInterface {
    create(input: inputCreateCardExpenses): Promise<void>
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
    active?: boolean;
    recurrent?: boolean;
}
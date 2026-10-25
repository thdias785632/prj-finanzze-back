import { CardDto } from "../../card/dto/card.dto";

export interface CardExpensesDto {
    id: string;
    cardId: string;
    userId: string;
    name: string;
    value: number;
    installments?: number
    installmentsActual?: number;
    referenceDate: Date;
    category: string;
    active: boolean;
    recurrent: boolean;
    pluggyTransactionId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CardExtractDto {
    card: CardDto;
    total: number;
    cardExpensess: CardExpensesDto[];
}
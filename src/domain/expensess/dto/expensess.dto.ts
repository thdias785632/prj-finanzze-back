export interface ExpensessDTO {
    id: string;
    userId: string;
    name: string;
    value: number;
    referenceDate: Date;
    endDate?: Date;
    active: boolean;
    category: string;
    recurrent: boolean;
    createdAt?: Date;
}
export interface RevenuesDTO {
    id: string;
    userId: string;
    referenceDate: Date;
    name: string;
    value: number;
    active: boolean;
    recurrent: boolean;
    createdAt?: Date;
}

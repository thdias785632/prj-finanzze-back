export interface CardDto {
    id: string;
    userId: string
    name: string;
    active: boolean;
    flag: string;
    pluggyItemId?: string;
    pluggyAccountId?: string;
}
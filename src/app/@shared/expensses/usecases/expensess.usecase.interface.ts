import { ExpensessDTO } from "../../../../domain/expensess/dto/expensess.dto";

export default interface ExpensessUseCaseInterface {
    create(input: inputCreateExpensess): Promise<void>
    update(input: inputUpdateExpensess): Promise<void>
    findByUserId(userId: string): Promise<ExpensessDTO[] | Error>
    findById(id: string): Promise<ExpensessDTO | Error>
    delete(id: string): Promise<void>
}

export interface inputCreateExpensess {
    userId: string;
    name: string;
    value: number;
    referenceDate: Date; 
    active: boolean;
    recurrent: boolean;
    category: string;
}

export interface inputUpdateExpensess {
    id: string;
    userId: string;
    name: string;
    value: number;
    referenceDate: Date; 
    active: boolean;
    recurrent: boolean;
    category: string;
}
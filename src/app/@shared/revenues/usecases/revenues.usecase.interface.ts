import { RevenuesDTO } from "../../../../domain/revenues/dto/revenues.dto";

export default interface RevenuesUseCaseInterface {
    create(input: inputCreateRevenues): Promise<void>
    findByUserId(userId: string): Promise<RevenuesDTO[] | Error>
    findById(id: string): Promise<RevenuesDTO | Error>
    delete(id: string): Promise<void>
}

export interface inputCreateRevenues {
    userId: string;
    name: string;
    value: number;
    referenceDate: Date; 
    active: boolean;
    recurrent: boolean;
}

export interface inputUpdateRevenues {
    id: string;
    userId: string;
    name: string;
    value: number;
    referenceDate: Date; 
    active: boolean;
    recurrent: boolean;
}
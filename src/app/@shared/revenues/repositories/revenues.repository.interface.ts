import { RevenuesDTO } from "../../../../domain/revenues/dto/revenues.dto";

export interface RevenuesRepositoryInterface {
    create(revenue: RevenuesDTO): Promise<void>;
    findByUserId(userId: string): Promise<RevenuesDTO[]>;
    findById(id: string): Promise<RevenuesDTO | undefined>
    delete(id: string): Promise<void>
}

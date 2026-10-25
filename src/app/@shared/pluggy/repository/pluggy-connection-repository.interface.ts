import { PluggyItemConnectionDto } from "../../../../domain/pluggy/dto/pluggy.dto";

export interface PluggyConnectionRepositoryInterface {
    create(connection: PluggyItemConnectionDto): Promise<void>;
    update(connection: PluggyItemConnectionDto): Promise<void>;
    findByItemId(itemId: string): Promise<PluggyItemConnectionDto | undefined>;
    findByUserId(userId: string): Promise<PluggyItemConnectionDto[]>;
    findAllActive(): Promise<PluggyItemConnectionDto[]>;
}

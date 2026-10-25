import { PluggyConnectionRepositoryInterface } from "../../../../app/@shared/pluggy/repository/pluggy-connection-repository.interface";
import { PluggyItemConnectionDto } from "../../../../domain/pluggy/dto/pluggy.dto";
import { DatabaseConnection } from "../../database/connection";

export class PluggyConnectionRepository implements PluggyConnectionRepositoryInterface {
    database = new DatabaseConnection();

    async create(connection: PluggyItemConnectionDto): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            INSERT INTO pluggy_items (
                id,
                user_id,
                item_id,
                connector_id,
                connector_name,
                status,
                execution_status,
                webhook_registered,
                last_synced_at,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                connection.id,
                connection.userId,
                connection.itemId,
                connection.connectorId,
                connection.connectorName,
                connection.status,
                connection.executionStatus,
                connection.webhookRegistered,
                connection.lastSyncedAt,
                connection.createdAt
            ]);

        await client.end();
    };

    async update(connection: PluggyItemConnectionDto): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            UPDATE pluggy_items
            SET
                status = $2,
                execution_status = $3,
                webhook_registered = $4,
                last_synced_at = $5,
                updated_at = $6
            WHERE item_id = $1
            `, [
                connection.itemId,
                connection.status,
                connection.executionStatus,
                connection.webhookRegistered,
                connection.lastSyncedAt,
                new Date()
            ]);

        await client.end();
    };

    async findByItemId(itemId: string): Promise<PluggyItemConnectionDto | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `SELECT * FROM pluggy_items WHERE item_id = $1`, [itemId]
        );

        await client.end();

        if (rows.length === 0) return undefined;

        return this.mapRow(rows[0]);
    };

    async findByUserId(userId: string): Promise<PluggyItemConnectionDto[]> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `SELECT * FROM pluggy_items WHERE user_id = $1 ORDER BY created_at DESC`, [userId]
        );

        await client.end();

        return rows.map((row) => this.mapRow(row));
    };

    async findAllActive(): Promise<PluggyItemConnectionDto[]> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `SELECT * FROM pluggy_items WHERE status IS DISTINCT FROM 'LOGIN_ERROR'`
        );

        await client.end();

        return rows.map((row) => this.mapRow(row));
    };

    private mapRow(row: any): PluggyItemConnectionDto {
        return {
            id: row.id,
            userId: row.user_id,
            itemId: row.item_id,
            connectorId: row.connector_id,
            connectorName: row.connector_name,
            status: row.status,
            executionStatus: row.execution_status,
            webhookRegistered: row.webhook_registered,
            lastSyncedAt: row.last_synced_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

import { RevenuesRepositoryInterface } from '../../../../app/@shared/revenues/repositories/revenues.repository.interface';
import { RevenuesDTO } from '../../../../domain/revenues/dto/revenues.dto';
import { DatabaseConnection } from '../../database/connection';

export class RevenuesRepository implements RevenuesRepositoryInterface {
    database = new DatabaseConnection();
    
    async create(revenue: RevenuesDTO): Promise<void> {
        const client = this.database.connect();

        await client.connect();
        
        await client.query(
            `
            INSERT INTO revenues (id, user_id, reference_date, name, value, active, recurrent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [revenue.id, revenue.userId, revenue.referenceDate, revenue.name, revenue.value, revenue.active, revenue.recurrent, revenue.createdAt]
        );
        
        await client.end();
    }
    
    async findByUserId(userId: string): Promise<RevenuesDTO[]> {
        const client = this.database.connect();

        await client.connect();
        
        const { rows } = await client.query(
            `
            SELECT * FROM revenues WHERE user_id = $1
            ORDER BY reference_date DESC
            `,
            [userId]
        );
        
        await client.end();
        
        return this.mapRowToRevenues(rows);
    }

    async findById(id: string): Promise<RevenuesDTO | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM revenues WHERE id = $1
            ORDER BY reference_date DESC
            `,
            [id]
        );

        await client.end();

        return rows.length > 0 ? this.mapRowToRevenues(rows)[0] : undefined;
    }
    
    async delete(id: string): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            DELETE FROM revenues 
            WHERE id = $1
            `,
            [id]
        );

        await client.end();
    }

    mapRowToRevenues(rows: any[]): RevenuesDTO[] {
            return rows.map((row) => {
                return {
                    id: row.id,
                    userId: row.user_id,
                    name: row.name,
                    value: row.value,
                    referenceDate: row.reference_date,
                    active: row.active,
                    recurrent: row.recurrent,
                    createdAt: row.created_at
                };
            });
    }
}

export default RevenuesRepository;
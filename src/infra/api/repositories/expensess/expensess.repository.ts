import { ExpensessRepositoryInterface } from "../../../../app/@shared/expensses/repositories/expensess.repository.interface";
import { ExpensessDTO } from "../../../../domain/expensess/dto/expensess.dto";
import { DatabaseConnection } from "../../database/connection";

export class ExpensessRepository implements ExpensessRepositoryInterface {
    database = new DatabaseConnection();
    
    async create(expensess: ExpensessDTO): Promise<void> {
        const client = this.database.connect();

        await client.connect();
        
        await client.query(
            `
            INSERT INTO expenses (
                id, 
                user_id, 
                name,
                value,
                reference_date,
                end_date,
                active,
                recurrent,
                created_at,
                category
            )
            VALUES (
                $1, 
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
            )
            `, [
                expensess.id, 
                expensess.userId, 
                expensess.name,
                expensess.value,
                expensess.referenceDate,
                expensess.endDate,
                expensess.active,
                expensess.recurrent,
                expensess.createdAt,
                expensess.category
            ]
        );

        await client.end();
    }

    async findByUserId(userId: string): Promise<ExpensessDTO[]> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM expenses WHERE user_id = $1
            ORDER BY reference_date DESC
            `, [userId]);
        
        await client.end();
        
        return this.mapRowToExpensess(rows);
    }

    async findById(id: string): Promise<ExpensessDTO | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM expenses WHERE id = $1
            ORDER BY reference_date DESC
            `, [id]);
        
        await client.end();

        return rows.length > 0 ? this.mapRowToExpensess(rows)[0] : undefined;
    }

    async delete(id: string): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            DELETE FROM expenses
            WHERE id = $1
            `, [id]
        );

        await client.end();
    }

    mapRowToExpensess(rows: any[]): ExpensessDTO[] {
        return rows.map((row) => {
            return {
                id: row.id,
                userId: row.user_id,
                name: row.name,
                value: row.value,
                referenceDate: row.reference_date,
                endDate: row.end_date,
                active: row.active,
                recurrent: row.recurrent,
                createdAt: row.created_at,
                category: row.category
            };
        });
    }
}
import { InvestimentoRepositoryInterface } from '../../../../app/@shared/investimento/repository/investimento.repository.interface';
import { InvestimentoDTO } from '../../../../domain/investimento/dto/investimento.dto';
import { DatabaseConnection } from '../../database/connection';

export class InvestimentoRepository implements InvestimentoRepositoryInterface {
    database = new DatabaseConnection();

    async create(investimento: InvestimentoDTO): Promise<void> {
        const client = this.database.connect();
        await client.connect();

        await client.query(
            `
            INSERT INTO investimentos (id, user_id, categoria_id, name, current_value, target_percentage, quantity, average_price, current_price, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
            [
                investimento.id,
                investimento.userId,
                investimento.categoriaId,
                investimento.name,
                investimento.currentValue,
                investimento.targetPercentage,
                investimento.quantity ?? null,
                investimento.averagePrice ?? null,
                investimento.currentPrice ?? null,
                investimento.createdAt
            ]
        );

        await client.end();
    }

    async findByUserId(userId: string): Promise<InvestimentoDTO[]> {
        const client = this.database.connect();
        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM investimentos
            WHERE user_id = $1
            ORDER BY name ASC
            `,
            [userId]
        );

        await client.end();

        return this.mapRowToInvestimento(rows);
    }

    async findById(id: string): Promise<InvestimentoDTO | undefined> {
        const client = this.database.connect();
        await client.connect();

        const { rows } = await client.query(
            `SELECT * FROM investimentos WHERE id = $1`,
            [id]
        );

        await client.end();

        return rows.length > 0 ? this.mapRowToInvestimento(rows)[0] : undefined;
    }

    async update(investimento: InvestimentoDTO): Promise<void> {
        const client = this.database.connect();
        await client.connect();

        await client.query(
            `
            UPDATE investimentos
            SET categoria_id = $1,
                name = $2,
                current_value = $3,
                target_percentage = $4,
                quantity = $5,
                average_price = $6,
                current_price = $7
            WHERE id = $8
            `,
            [
                investimento.categoriaId,
                investimento.name,
                investimento.currentValue,
                investimento.targetPercentage,
                investimento.quantity ?? null,
                investimento.averagePrice ?? null,
                investimento.currentPrice ?? null,
                investimento.id
            ]
        );

        await client.end();
    }

    async delete(id: string): Promise<void> {
        const client = this.database.connect();
        await client.connect();

        await client.query(
            `DELETE FROM investimentos WHERE id = $1`,
            [id]
        );

        await client.end();
    }

    mapRowToInvestimento(rows: any[]): InvestimentoDTO[] {
        return rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            categoriaId: row.categoria_id,
            name: row.name,
            currentValue: Number(row.current_value),
            targetPercentage: Number(row.target_percentage),
            quantity: row.quantity != null ? Number(row.quantity) : undefined,
            averagePrice: row.average_price != null ? Number(row.average_price) : undefined,
            currentPrice: row.current_price != null ? Number(row.current_price) : undefined,
            createdAt: row.created_at
        }));
    }
}

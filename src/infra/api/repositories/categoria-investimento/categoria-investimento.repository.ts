import { CategoriaInvestimentoRepositoryInterface } from '../../../../app/@shared/categoria-investimento/repository/categoria-investimento.repository.interface';
import { CategoriaInvestimentoDTO } from '../../../../domain/categoria-investimento/dto/categoria-investimento.dto';
import { DatabaseConnection } from '../../database/connection';

export class CategoriaInvestimentoRepository implements CategoriaInvestimentoRepositoryInterface {
    database = new DatabaseConnection();

    async create(categoria: CategoriaInvestimentoDTO): Promise<void> {
        const client = this.database.connect();
        await client.connect();

        await client.query(
            `
            INSERT INTO categorias_investimento (id, user_id, name, target_percentage, created_at)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [categoria.id, categoria.userId, categoria.name, categoria.targetPercentage, categoria.createdAt]
        );

        await client.end();
    }

    async findByUserId(userId: string): Promise<CategoriaInvestimentoDTO[]> {
        const client = this.database.connect();
        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM categorias_investimento
            WHERE user_id = $1
            ORDER BY name ASC
            `,
            [userId]
        );

        await client.end();

        return this.mapRowToCategoria(rows);
    }

    async findById(id: string): Promise<CategoriaInvestimentoDTO | undefined> {
        const client = this.database.connect();
        await client.connect();

        const { rows } = await client.query(
            `SELECT * FROM categorias_investimento WHERE id = $1`,
            [id]
        );

        await client.end();

        return rows.length > 0 ? this.mapRowToCategoria(rows)[0] : undefined;
    }

    async delete(id: string): Promise<void> {
        const client = this.database.connect();
        await client.connect();

        await client.query(
            `DELETE FROM categorias_investimento WHERE id = $1`,
            [id]
        );

        await client.end();
    }

    mapRowToCategoria(rows: any[]): CategoriaInvestimentoDTO[] {
        return rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            targetPercentage: Number(row.target_percentage),
            createdAt: row.created_at
        }));
    }
}

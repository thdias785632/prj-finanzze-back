import { Client } from 'pg';
import { ImovelRepositoryInterface } from '../../../../app/@shared/imovel/repository/imovel.repository.interface';
import { ImovelDTO, ImovelFluxoDTO, ImovelParcelaDTO } from '../../../../domain/imovel/dto/imovel.dto';
import { DatabaseConnection } from '../../database/connection';

// Colunas DATE são lidas como texto (YYYY-MM-DD) para não sofrer com fuso horário.
const IMOVEL_COLS = `id, user_id, name, developer, address, total_value,
    to_char(contract_date, 'YYYY-MM-DD') AS contract_date,
    to_char(incc_base_month, 'YYYY-MM-DD') AS incc_base_month,
    incc_lag_months,
    to_char(delivery_date, 'YYYY-MM-DD') AS delivery_date,
    to_char(financing_start_date, 'YYYY-MM-DD') AS financing_start_date,
    notes, active, created_at, updated_at`;

const FLUXO_COLS = `id, imovel_id, user_id, type, description, installments_count, installment_amount,
    to_char(first_due_date, 'YYYY-MM-DD') AS first_due_date, periodicity_months, index_type, created_at`;

const PARCELA_COLS = `id, imovel_id, fluxo_id, user_id, number,
    to_char(due_date, 'YYYY-MM-DD') AS due_date, base_amount, paid,
    to_char(paid_at, 'YYYY-MM-DD') AS paid_at, paid_amount, created_at, updated_at`;

export class ImovelRepository implements ImovelRepositoryInterface {
    database = new DatabaseConnection();

    private async run<T>(fn: (client: Client) => Promise<T>): Promise<T> {
        const client = this.database.connect();

        await client.connect();

        try {
            return await fn(client);
        } finally {
            await client.end();
        }
    }

    async create(imovel: ImovelDTO, fluxos: ImovelFluxoDTO[], parcelas: ImovelParcelaDTO[]): Promise<void> {
        await this.run(async (client) => {
            await client.query('BEGIN');

            try {
                await this.insertImovel(client, imovel);

                for (const fluxo of fluxos) await this.insertFluxo(client, fluxo);

                await this.insertParcelas(client, parcelas);

                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    }

    private async insertImovel(client: Client, i: ImovelDTO): Promise<void> {
        await client.query(
            `INSERT INTO imoveis (id, user_id, name, developer, address, total_value, contract_date, incc_base_month,
                incc_lag_months, delivery_date, financing_start_date, notes, active, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [i.id, i.userId, i.name, i.developer ?? null, i.address ?? null, i.totalValue, i.contractDate, i.inccBaseMonth,
                i.inccLagMonths, i.deliveryDate ?? null, i.financingStartDate ?? null, i.notes ?? null, i.active, i.createdAt ?? new Date()]
        );
    }

    private async insertFluxo(client: Client, f: ImovelFluxoDTO): Promise<void> {
        await client.query(
            `INSERT INTO imovel_fluxos (id, imovel_id, user_id, type, description, installments_count, installment_amount,
                first_due_date, periodicity_months, index_type, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [f.id, f.imovelId, f.userId, f.type, f.description, f.installmentsCount, f.installmentAmount,
                f.firstDueDate, f.periodicityMonths, f.indexType, f.createdAt ?? new Date()]
        );
    }

    private async insertParcelas(client: Client, parcelas: ImovelParcelaDTO[]): Promise<void> {
        const CHUNK = 200;

        for (let start = 0; start < parcelas.length; start += CHUNK) {
            const chunk = parcelas.slice(start, start + CHUNK);
            const values: any[] = [];
            const placeholders = chunk.map((p, idx) => {
                const o = idx * 8;

                values.push(p.id, p.imovelId, p.fluxoId, p.userId, p.number, p.dueDate, p.baseAmount, p.createdAt ?? new Date());

                return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;
            });

            await client.query(
                `INSERT INTO imovel_parcelas (id, imovel_id, fluxo_id, user_id, number, due_date, base_amount, created_at)
                 VALUES ${placeholders.join(',')}`,
                values
            );
        }
    }

    async findByUserId(userId: string): Promise<ImovelDTO[]> {
        return this.run(async (client) => {
            const { rows } = await client.query(
                `SELECT ${IMOVEL_COLS} FROM imoveis WHERE user_id = $1 AND active = true ORDER BY created_at DESC`, [userId]);

            return rows.map((r) => this.mapImovel(r));
        });
    }

    async findById(id: string): Promise<ImovelDTO | undefined> {
        return this.run(async (client) => {
            const { rows } = await client.query(`SELECT ${IMOVEL_COLS} FROM imoveis WHERE id = $1`, [id]);

            return rows[0] ? this.mapImovel(rows[0]) : undefined;
        });
    }

    async update(i: ImovelDTO): Promise<void> {
        await this.run((client) => client.query(
            `UPDATE imoveis SET name=$2, developer=$3, address=$4, total_value=$5, incc_base_month=$6, incc_lag_months=$7,
                delivery_date=$8, financing_start_date=$9, notes=$10, active=$11, updated_at=now()
             WHERE id=$1`,
            [i.id, i.name, i.developer ?? null, i.address ?? null, i.totalValue, i.inccBaseMonth, i.inccLagMonths,
                i.deliveryDate ?? null, i.financingStartDate ?? null, i.notes ?? null, i.active]
        ));
    }

    async delete(id: string): Promise<void> {
        await this.run((client) => client.query(`DELETE FROM imoveis WHERE id = $1`, [id]));
    }

    async findFluxosByImovelIds(imovelIds: string[]): Promise<ImovelFluxoDTO[]> {
        if (imovelIds.length === 0) return [];

        return this.run(async (client) => {
            const { rows } = await client.query(
                `SELECT ${FLUXO_COLS} FROM imovel_fluxos WHERE imovel_id = ANY($1::uuid[]) ORDER BY first_due_date, created_at`, [imovelIds]);

            return rows.map((r) => this.mapFluxo(r));
        });
    }

    async findFluxoById(id: string): Promise<ImovelFluxoDTO | undefined> {
        return this.run(async (client) => {
            const { rows } = await client.query(`SELECT ${FLUXO_COLS} FROM imovel_fluxos WHERE id = $1`, [id]);

            return rows[0] ? this.mapFluxo(rows[0]) : undefined;
        });
    }

    async addFluxo(fluxo: ImovelFluxoDTO, parcelas: ImovelParcelaDTO[]): Promise<void> {
        await this.run(async (client) => {
            await client.query('BEGIN');

            try {
                await this.insertFluxo(client, fluxo);
                await this.insertParcelas(client, parcelas);
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    }

    async deleteFluxo(id: string): Promise<void> {
        await this.run((client) => client.query(`DELETE FROM imovel_fluxos WHERE id = $1`, [id]));
    }

    async findParcelasByImovelIds(imovelIds: string[]): Promise<ImovelParcelaDTO[]> {
        if (imovelIds.length === 0) return [];

        return this.run(async (client) => {
            const { rows } = await client.query(
                `SELECT ${PARCELA_COLS} FROM imovel_parcelas WHERE imovel_id = ANY($1::uuid[]) ORDER BY due_date, number`, [imovelIds]);

            return rows.map((r) => this.mapParcela(r));
        });
    }

    async findParcelaById(id: string): Promise<ImovelParcelaDTO | undefined> {
        return this.run(async (client) => {
            const { rows } = await client.query(`SELECT ${PARCELA_COLS} FROM imovel_parcelas WHERE id = $1`, [id]);

            return rows[0] ? this.mapParcela(rows[0]) : undefined;
        });
    }

    async updateParcela(p: ImovelParcelaDTO): Promise<void> {
        await this.run((client) => client.query(
            `UPDATE imovel_parcelas SET due_date=$2, base_amount=$3, paid=$4, paid_at=$5, paid_amount=$6, updated_at=now() WHERE id=$1`,
            [p.id, p.dueDate, p.baseAmount, p.paid, p.paidAt ?? null, p.paidAmount ?? null]
        ));
    }

    private mapImovel(r: any): ImovelDTO {
        return {
            id: r.id, userId: r.user_id, name: r.name, developer: r.developer ?? undefined, address: r.address ?? undefined,
            totalValue: Number(r.total_value), contractDate: r.contract_date, inccBaseMonth: r.incc_base_month,
            inccLagMonths: Number(r.incc_lag_months), deliveryDate: r.delivery_date ?? undefined,
            financingStartDate: r.financing_start_date ?? undefined, notes: r.notes ?? undefined, active: r.active,
            createdAt: r.created_at, updatedAt: r.updated_at ?? undefined
        };
    }

    private mapFluxo(r: any): ImovelFluxoDTO {
        return {
            id: r.id, imovelId: r.imovel_id, userId: r.user_id, type: r.type, description: r.description,
            installmentsCount: Number(r.installments_count), installmentAmount: Number(r.installment_amount),
            firstDueDate: r.first_due_date, periodicityMonths: Number(r.periodicity_months), indexType: r.index_type,
            createdAt: r.created_at
        };
    }

    private mapParcela(r: any): ImovelParcelaDTO {
        return {
            id: r.id, imovelId: r.imovel_id, fluxoId: r.fluxo_id, userId: r.user_id, number: Number(r.number),
            dueDate: r.due_date, baseAmount: Number(r.base_amount), paid: r.paid, paidAt: r.paid_at ?? undefined,
            paidAmount: r.paid_amount !== null && r.paid_amount !== undefined ? Number(r.paid_amount) : undefined,
            createdAt: r.created_at, updatedAt: r.updated_at ?? undefined
        };
    }
}

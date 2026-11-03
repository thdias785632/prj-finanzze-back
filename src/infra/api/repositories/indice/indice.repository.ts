import { IndiceRepositoryInterface } from '../../../../app/@shared/indice/repository/indice.repository.interface';
import { IndiceEconomicoDTO } from '../../../../domain/imovel/dto/imovel.dto';
import { DatabaseConnection } from '../../database/connection';

export class IndiceRepository implements IndiceRepositoryInterface {
    database = new DatabaseConnection();

    async upsertMany(series: string, rows: { refMonth: string; variation: number }[], source: 'BCB' | 'MANUAL'): Promise<void> {
        if (rows.length === 0) return;

        const client = this.database.connect();

        await client.connect();

        try {
            const values: any[] = [];
            const placeholders = rows.map((row, idx) => {
                const o = idx * 4;

                values.push(series, `${row.refMonth}-01`, row.variation, source);

                return `($${o + 1},$${o + 2},$${o + 3},$${o + 4})`;
            });

            await client.query(
                `INSERT INTO indices_economicos (series, ref_month, variation, source)
                 VALUES ${placeholders.join(',')}
                 ON CONFLICT (series, ref_month) DO UPDATE
                    SET variation = EXCLUDED.variation, source = EXCLUDED.source, updated_at = now()
                    WHERE indices_economicos.source <> 'MANUAL' OR EXCLUDED.source = 'MANUAL'`,
                values
            );
        } finally {
            await client.end();
        }
    }

    async findAll(series: string): Promise<IndiceEconomicoDTO[]> {
        return this.findRange(series);
    }

    async findRange(series: string, fromYm?: string, toYm?: string): Promise<IndiceEconomicoDTO[]> {
        const client = this.database.connect();

        await client.connect();

        try {
            const params: any[] = [series];
            let where = 'series = $1';

            if (fromYm) { params.push(`${fromYm}-01`); where += ` AND ref_month >= $${params.length}`; }
            if (toYm) { params.push(`${toYm}-01`); where += ` AND ref_month <= $${params.length}`; }

            const { rows } = await client.query(
                `SELECT series, to_char(ref_month, 'YYYY-MM') AS ref_month, variation, source
                 FROM indices_economicos WHERE ${where} ORDER BY ref_month`, params);

            return rows.map((r) => ({ series: r.series, refMonth: r.ref_month, variation: Number(r.variation), source: r.source }));
        } finally {
            await client.end();
        }
    }
}

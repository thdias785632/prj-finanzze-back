// Cliente da API pública de séries temporais do Banco Central (SGS). Não exige autenticação.
// INCC (variação % mensal) = série 192. Doc: https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados?formato=json
const SGS_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

export interface BcbPoint {
    refMonth: string;   // YYYY-MM
    variation: number;  // %
}

export class BcbClient {
    // A API limita a consulta a 10 anos por chamada.
    async fetchMonthlySeries(code: number, fromYm: string, to: Date = new Date()): Promise<BcbPoint[]> {
        const [year, month] = fromYm.split('-');
        const initial = `01/${month}/${year}`;
        const final = `${String(to.getUTCDate()).padStart(2, '0')}/${String(to.getUTCMonth() + 1).padStart(2, '0')}/${to.getUTCFullYear()}`;

        const url = `${SGS_BASE}.${code}/dados?formato=json&dataInicial=${initial}&dataFinal=${final}`;

        const response = await fetch(url, {
            headers: { Accept: 'application/json', 'User-Agent': 'finanzze-backend/1.0' }
        });

        if (!response.ok) {
            throw new Error(`BCB SGS ${code} respondeu ${response.status}: ${(await response.text()).slice(0, 200)}`);
        }

        const data = (await response.json()) as { data: string; valor: string }[];

        return data
            .map((row) => {
                const [, m, y] = row.data.split('/');

                return { refMonth: `${y}-${m}`, variation: Number(String(row.valor).replace(',', '.')) };
            })
            .filter((point) => Number.isFinite(point.variation));
    }
}

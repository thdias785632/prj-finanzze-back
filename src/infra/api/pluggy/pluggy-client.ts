import { injectable } from "inversify";
import dotenv from "dotenv";
import { FetchTransactionsOptions, PluggyClientInterface, PluggyItemStatusDto } from "../../../app/@shared/pluggy/client/pluggy-client.interface";
import { PluggyAccountDto, PluggyTransactionDto, PluggyTransactionsPageDto } from "../../../domain/pluggy/dto/pluggy.dto";

dotenv.config();

/**
 * Cliente HTTP cru para a API da Pluggy (https://docs.pluggy.ai).
 * Usa o `fetch` global do Node 18+ (não precisa de axios/undici como dependência extra).
 *
 * IMPORTANTE: a Pluggy pode alterar o formato de resposta dos endpoints com o tempo.
 * Antes de ir pra produção, confira o formato mais atual em:
 * https://docs.pluggy.ai/reference (ou o OpenAPI spec em https://api.pluggy.ai/oas3.json)
 * principalmente do GET /v2/transactions (paginação por cursor).
 */
@injectable()
export class PluggyClient implements PluggyClientInterface {
    private baseUrl = process.env.PLUGGY_BASE_URL || "https://api.pluggy.ai";
    private clientId = process.env.PLUGGY_CLIENT_ID;
    private clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    private apiKey: string | undefined;
    private apiKeyExpiresAt = 0; // epoch ms

    private async getApiKey(forceRefresh = false): Promise<string> {
        if (!this.clientId || !this.clientSecret) {
            throw new Error("PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET não configurados no .env");
        }

        const isExpired = Date.now() >= this.apiKeyExpiresAt;

        if (this.apiKey && !isExpired && !forceRefresh) {
            return this.apiKey;
        }

        const response = await fetch(`${this.baseUrl}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: this.clientId,
                clientSecret: this.clientSecret
            })
        });

        if (!response.ok) {
            throw new Error(`Falha ao autenticar na Pluggy: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();

        this.apiKey = data.apiKey;
        // A apiKey da Pluggy expira em 2h; renovamos com 10min de folga.
        this.apiKeyExpiresAt = Date.now() + 110 * 60 * 1000;

        return this.apiKey as string;
    }

    private async request<T>(path: string, init?: RequestInit, retrying = false): Promise<T> {
        const apiKey = await this.getApiKey();

        const response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
                ...(init?.headers || {})
            }
        });

        if (response.status === 403 && !retrying) {
            // apiKey pode ter expirado/sido revogada; renova e tenta 1x
            await this.getApiKey(true);

            return this.request<T>(path, init, true);
        }

        if (!response.ok) {
            throw new Error(`Erro na chamada Pluggy [${path}]: ${response.status} ${await response.text()}`);
        }

        return response.json() as Promise<T>;
    }

    async fetchItem(itemId: string): Promise<PluggyItemStatusDto> {
        return this.request<PluggyItemStatusDto>(`/items/${itemId}`);
    }

    async fetchAccounts(itemId: string): Promise<PluggyAccountDto[]> {
        const data = await this.request<{ results: PluggyAccountDto[] }>(`/accounts?itemId=${itemId}`);

        return data.results || [];
    }

    async fetchTransactionsPage(accountId: string, options: FetchTransactionsOptions = {}): Promise<PluggyTransactionsPageDto> {
        const params = new URLSearchParams({ accountId });

        if (options.cursor) params.set("cursor", options.cursor);
        if (options.createdAtFrom) params.set("createdAtFrom", options.createdAtFrom);
        if (options.dateFrom) params.set("from", options.dateFrom);

        const data = await this.request<{ results: PluggyTransactionDto[]; cursor?: string | null; nextCursor?: string | null; total?: number }>(
            `/v2/transactions?${params.toString()}`
        );

        return {
            results: data.results || [],
            nextCursor: data.nextCursor ?? data.cursor ?? null,
            total: data.total
        };
    }

    async fetchTransactionsByIds(ids: string[]): Promise<PluggyTransactionDto[]> {
        if (ids.length === 0) return [];

        const params = new URLSearchParams({ ids: ids.join(",") });

        const data = await this.request<{ results: PluggyTransactionDto[] }>(`/transactions?${params.toString()}`);

        return data.results || [];
    }

    async fetchTransactionsFromLink(link: string): Promise<PluggyTransactionDto[]> {
        // O `createdTransactionsLink` vem pronto no payload do webhook `transactions/created`,
        // já apontando pro endpoint /transactions com os filtros corretos.
        const results: PluggyTransactionDto[] = [];
        let nextLink: string | undefined = link;

        while (nextLink) {
            const data: { results: PluggyTransactionDto[]; next?: string } = await this.request(
                nextLink.replace(this.baseUrl, "")
            );

            results.push(...(data.results || []));
            nextLink = data.next;
        }

        return results;
    }

    async ensureWebhook(url: string): Promise<void> {
        const webhooksData = await this.request<{ results: { id: string; url: string; event: string }[] }>("/webhooks");

        const webhooks = webhooksData.results || [];

        const events = ["transactions/created", "transactions/updated", "transactions/deleted", "item/updated"];

        for (const event of events) {
            const alreadyExists = webhooks.some((w) => w.url === url && w.event === event);

            if (alreadyExists) continue;

            await this.request("/webhooks", {
                method: "POST",
                body: JSON.stringify({ url, event })
            });
        }
    }
}

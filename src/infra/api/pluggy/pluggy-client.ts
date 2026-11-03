import { injectable } from "inversify";
import dotenv from "dotenv";
import { FetchTransactionsOptions, PluggyClientInterface, PluggyItemStatusDto } from "../../../app/@shared/pluggy/client/pluggy-client.interface";
import { PluggyAccountDto, PluggyTransactionDto, PluggyTransactionsPageDto, PluggyWebhookDto } from "../../../domain/pluggy/dto/pluggy.dto";

dotenv.config();

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

    async refreshItem(itemId: string): Promise<void> {
        await this.request(`/items/${itemId}`, { method: "PATCH", body: JSON.stringify({}) });
    }

    async fetchTransactionsPage(accountId: string, options: FetchTransactionsOptions = {}): Promise<PluggyTransactionsPageDto> {
        let path: string;

        if (options.next) {
            path = `/v2/transactions${options.next.startsWith("?") ? options.next : `?${options.next}`}`;
        } else {
            const params = new URLSearchParams({ accountId });

            if (options.ids?.length) params.set("ids", options.ids.join(","));
            if (options.createdAtFrom) {
                params.set("createdAtFrom", options.createdAtFrom);
            } else if (options.dateFrom) {
                params.set("dateFrom", options.dateFrom);
            }
            if (options.dateTo) params.set("dateTo", options.dateTo);

            path = `/v2/transactions?${params.toString()}`;
        }

        const data = await this.request<{ results?: PluggyTransactionDto[]; next?: string | null }>(path);

        return { results: data.results || [], next: data.next || null };
    }

    async fetchAllTransactions(accountId: string, options: FetchTransactionsOptions = {}): Promise<PluggyTransactionDto[]> {
        const all: PluggyTransactionDto[] = [];
        const MAX_PAGES = 200;
        let next: string | undefined = options.next;

        for (let page = 0; page < MAX_PAGES; page++) {
            const data = await this.fetchTransactionsPage(accountId, { ...options, next });

            all.push(...data.results);

            if (!data.next) break;

            next = data.next;
        }

        return all;
    }

    async fetchTransactionsByIds(ids: string[], accountId?: string): Promise<PluggyTransactionDto[]> {
        if (ids.length === 0) return [];

        const results: PluggyTransactionDto[] = [];

        if (accountId) {
            // v2 exige accountId; até 500 ids por chamada
            for (let i = 0; i < ids.length; i += 500) {
                results.push(...(await this.fetchAllTransactions(accountId, { ids: ids.slice(i, i + 500) })));
            }

            return results;
        }

        // sem accountId: busca uma a uma (GET /transactions/{id})
        for (const id of ids) {
            try {
                results.push(await this.request<PluggyTransactionDto>(`/transactions/${id}`));
            } catch (error) {
                console.error(`[pluggy] Falha ao buscar transação ${id}:`, error);
            }
        }

        return results;
    }

    // O `createdTransactionsLink` do webhook aponta para o endpoint antigo (/transactions, que será
    // removido em 2026-12-31). Só extraímos accountId/createdAtFrom dele e buscamos pelo /v2.
    async fetchTransactionsFromLink(link: string): Promise<PluggyTransactionDto[]> {
        const url = new URL(link);
        const accountId = url.searchParams.get("accountId");
        const createdAtFrom = url.searchParams.get("createdAtFrom") || undefined;

        if (!accountId) throw new Error(`createdTransactionsLink sem accountId: ${link}`);

        return this.fetchAllTransactions(accountId, { createdAtFrom });
    }

    async listWebhooks(): Promise<PluggyWebhookDto[]> {
        const data = await this.request<any>("/webhooks");

        return Array.isArray(data) ? data : (data?.results || []);
    }

    async ensureWebhook(url: string): Promise<PluggyWebhookDto[]> {
        const existing = await this.listWebhooks();

        const events = ["transactions/created", "transactions/updated", "transactions/deleted", "item/updated"];

        for (const event of events) {
            const alreadyExists = existing.some((w) => w.url === url && (w.event === event || w.event === "all"));

            if (alreadyExists) continue;

            await this.request("/webhooks", {
                method: "POST",
                body: JSON.stringify({ url, event })
            });
        }

        return this.listWebhooks();
    }
}

import { PluggyAccountDto, PluggyTransactionDto, PluggyTransactionsPageDto } from "../../../../domain/pluggy/dto/pluggy.dto";

export interface FetchTransactionsOptions {
    createdAtFrom?: string; // ISO date - usado no sync incremental
    dateFrom?: string;      // ISO date - usado no sync retroativo
    cursor?: string;
    pageSize?: number;
}

export interface PluggyItemStatusDto {
    id: string;
    connector: { id: number; name: string };
    status: string;
    executionStatus: string;
}

export interface PluggyClientInterface {
    fetchItem(itemId: string): Promise<PluggyItemStatusDto>;
    fetchAccounts(itemId: string): Promise<PluggyAccountDto[]>;
    fetchTransactionsPage(accountId: string, options?: FetchTransactionsOptions): Promise<PluggyTransactionsPageDto>;
    fetchTransactionsByIds(ids: string[]): Promise<PluggyTransactionDto[]>;
    fetchTransactionsFromLink(link: string): Promise<PluggyTransactionDto[]>;
    ensureWebhook(url: string): Promise<void>;
}

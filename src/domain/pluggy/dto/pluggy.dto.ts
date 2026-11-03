// Representa a conexão (Item) da Pluggy que já vinculamos a um usuário do Finanzze.
export interface PluggyItemConnectionDto {
    id: string;
    userId: string;
    itemId: string;
    connectorId?: number;
    connectorName?: string;
    status?: string;
    executionStatus?: string;
    webhookRegistered: boolean;
    lastSyncedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// Campos que realmente usamos da resposta de GET /accounts da Pluggy.
// A Pluggy retorna mais campos do que isso; ver https://docs.pluggy.ai/reference/accounts
export interface PluggyAccountDto {
    id: string;
    itemId: string;
    type: string;          // 'BANK' | 'CREDIT'
    subtype?: string;
    name: string;
    marketingName?: string;
    creditData?: {
        brand?: string;
        level?: string;
        creditLimit?: number;
        availableCreditLimit?: number;
    };
}

// Campos que usamos da resposta de transações (GET /v2/transactions e GET /transactions).
// Ver https://docs.pluggy.ai/reference/transactions-list
export interface PluggyTransactionDto {
    id: string;
    accountId: string;
    description: string;
    descriptionRaw?: string;
    amount: number;
    date: string;
    category?: string;
    type?: string; // 'DEBIT' | 'CREDIT'
    status?: string; // 'POSTED' | 'PENDING'
    creditCardMetadata?: {
        installmentNumber?: number;
        totalInstallments?: number;
        payeeMccCategory?: string;
    };
}

// GET /v2/transactions: paginação por cursor. `next` já vem pronto ("?accountId=...&after=...")
// para ser anexado ao path (GET /v2/transactions{next}); é null na última página.
export interface PluggyTransactionsPageDto {
    results: PluggyTransactionDto[];
    next: string | null;
}

export interface PluggyWebhookDto {
    id: string;
    url: string;
    event: string;
}

export interface SyncSummaryDto {
    fetched: number;
    created: number;
    updated: number;
    failed: number;
}

import { PluggyAccountDto, PluggyTransactionDto, PluggyTransactionsPageDto, PluggyWebhookDto } from "../../../../domain/pluggy/dto/pluggy.dto";

export interface FetchTransactionsOptions {
    // Filtro por data da transação (yyyy-mm-dd). NÃO pode ser usado junto com createdAtFrom.
    dateFrom?: string;
    dateTo?: string;
    // Filtro por data em que a Pluggy coletou/criou a transação (ISO). Pega "novidades" mesmo de datas antigas.
    createdAtFrom?: string;
    // Até 500 ids por chamada.
    ids?: string[];
    // Cursor da próxima página: valor `next` devolvido pela página anterior.
    next?: string;
}

export interface PluggyItemStatusDto {
    id: string;
    connector: { id: number; name: string };
    status: string;
    executionStatus: string;
}

export interface PluggyClientInterface {
    fetchItem(itemId: string): Promise<PluggyItemStatusDto>;
    // Pede à Pluggy que colete os dados do banco de novo (PATCH /items/{id}); ao terminar vem o webhook item/updated.
    refreshItem(itemId: string): Promise<void>;
    fetchAccounts(itemId: string): Promise<PluggyAccountDto[]>;
    fetchTransactionsPage(accountId: string, options?: FetchTransactionsOptions): Promise<PluggyTransactionsPageDto>;
    // Percorre todas as páginas (com trava de segurança).
    fetchAllTransactions(accountId: string, options?: FetchTransactionsOptions): Promise<PluggyTransactionDto[]>;
    fetchTransactionsByIds(ids: string[], accountId?: string): Promise<PluggyTransactionDto[]>;
    fetchTransactionsFromLink(link: string): Promise<PluggyTransactionDto[]>;
    listWebhooks(): Promise<PluggyWebhookDto[]>;
    ensureWebhook(url: string): Promise<PluggyWebhookDto[]>;
}

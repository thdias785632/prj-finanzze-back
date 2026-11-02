import { SyncSummaryDto } from "../../../../domain/pluggy/dto/pluggy.dto";

export interface PluggySyncUseCaseInterface {
    // histórico completo de um cartão (primeira conexão)
    syncAccountRetroactive(cardId: string): Promise<SyncSummaryDto>;
    syncAccountIncremental(cardId: string, sinceISO?: string): Promise<SyncSummaryDto>;
    // webhooks
    syncFromCreatedLink(link: string): Promise<SyncSummaryDto>;
    syncByTransactionIds(transactionIds: string[], accountId?: string): Promise<SyncSummaryDto>;
    removeByTransactionIds(transactionIds: string[]): Promise<void>;
    // sincroniza os últimos dias de todos os cartões de um Item (usado no item/updated, no cron e no endpoint manual)
    syncItem(itemId: string, lookbackDays?: number): Promise<SyncSummaryDto>;
    syncUser(userId: string, lookbackDays?: number): Promise<SyncSummaryDto>;
    // rede de segurança: roda syncItem em todas as conexões ativas (sem pedir refresh à Pluggy)
    syncAllActiveConnections(): Promise<void>;
    // job diário: pede à Pluggy para coletar os dados do banco novamente (PATCH /items/{id})
    refreshAllItems(userId?: string): Promise<{ requested: number; failed: number }>;
}

export interface PluggyConnectionUseCaseInterface {
    connectItem(input: inputConnectItem): Promise<void>;
    handleItemUpdated(itemId: string): Promise<void>;
}

export interface inputConnectItem {
    userId: string;
    itemId: string;
}

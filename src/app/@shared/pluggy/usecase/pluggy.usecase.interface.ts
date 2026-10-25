export interface PluggySyncUseCaseInterface {
    syncAccountRetroactive(cardId: string): Promise<void>;
    syncAccountIncremental(cardId: string, sinceISO?: string): Promise<void>;
    syncFromCreatedLink(link: string): Promise<void>;
    syncByTransactionIds(transactionIds: string[]): Promise<void>;
    removeByTransactionIds(transactionIds: string[]): Promise<void>;
    syncAllActiveConnections(): Promise<void>;
}

export interface PluggyConnectionUseCaseInterface {
    connectItem(input: inputConnectItem): Promise<void>;
    handleItemUpdated(itemId: string): Promise<void>;
}

export interface inputConnectItem {
    userId: string;
    itemId: string;
}

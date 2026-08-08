import { CardExpensesRepositoryInterface } from "../../../../app/@shared/card-expenses/repository/card-expenses-repository.interface";
import { CardExpensesDto } from "../../../../domain/card-expenses/dto/card-expenses.dto";
import { DatabaseConnection } from "../../database/connection";

export class CardExpensesRepository implements CardExpensesRepositoryInterface {
    database = new DatabaseConnection();
    
    async create(cardExpense: CardExpensesDto): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            INSERT INTO card_expenses (
                id, 
                card_id, 
                user_id, 
                name,
                value,
                installments,
                reference_date,
                active,
                category,
                recurrent,
                pluggy_transaction_id,
                created_at
            )
            VALUES (
                $1, 
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12
            )
            ON CONFLICT (pluggy_transaction_id) DO NOTHING
            `, [
                cardExpense.id, 
                cardExpense.cardId, 
                cardExpense.userId, 
                cardExpense.name,
                cardExpense.value,
                cardExpense.installments,
                cardExpense.referenceDate,
                cardExpense.active,
                cardExpense.category,
                cardExpense.recurrent,
                cardExpense.pluggyTransactionId,
                cardExpense.createdAt
            ]);
    
        await client.end();
    };

    async update(card: CardExpensesDto): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            UPDATE card_expenses
            SET
                card_id = $2,
                user_id = $3,
                name = $4,
                value = $5,
                installments = $6,
                reference_date = $7,
                active = $8,
                category = $9,
                recurrent = $10,
                updated_at = $11
            WHERE id = $1
            `, [
                card.id,
                card.cardId,
                card.userId,
                card.name,
                card.value,
                card.installments,
                card.referenceDate,
                card.active,
                card.category,
                card.recurrent,
                card.updatedAt
            ]);
            
        await client.end();
    }

    async findByUserId(userId: string): Promise<CardExpensesDto[]> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM card_expenses WHERE user_id = $1
            ORDER BY reference_date DESC
            `, [userId]);
        
        await client.end();

        return this.mapRowToCardExpense(rows);
    };

    async findByCardId(cardId: string): Promise<CardExpensesDto[]> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM card_expenses WHERE card_id = $1
            ORDER BY reference_date DESC
            `, [cardId]);
        
        await client.end();

        return this.mapRowToCardExpense(rows);
    };

    async delete(id: string): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            DELETE FROM card_expenses
            WHERE id = $1
            `, [id]
        );
            
        await client.end();
    };

    async findByPluggyTransactionId(pluggyTransactionId: string): Promise<CardExpensesDto | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM card_expenses WHERE pluggy_transaction_id = $1
            `, [pluggyTransactionId]);

        await client.end();

        const mapped = this.mapRowToCardExpense(rows);

        return mapped[0];
    };

    async deleteByPluggyTransactionIds(pluggyTransactionIds: string[]): Promise<void> {
        if (pluggyTransactionIds.length === 0) return;

        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            DELETE FROM card_expenses
            WHERE pluggy_transaction_id = ANY($1::varchar[])
            `, [pluggyTransactionIds]
        );

        await client.end();
    };

    private mapRowToCardExpense(row: any[]): CardExpensesDto[] {
        return row.map((row) => {
            return {
                id: row.id,
                cardId: row.card_id,
                userId: row.user_id,
                name: row.name,
                value: Number(row.value),
                installments: row.installments !== null ? Number(row.installments) : undefined,
                referenceDate: row.reference_date,
                active: row.active,
                category: row.category,
                recurrent: row.recurrent,
                pluggyTransactionId: row.pluggy_transaction_id,
                createdAt: row.created_at
            }
        });
    }
}
import { CardRepositoryInterface } from "../../../../app/@shared/card/repository/card-repository.interface";
import { CardDto } from "../../../../domain/card/dto/card.dto";
import { DatabaseConnection } from "../../database/connection";

export class CardRepository implements CardRepositoryInterface {
    database = new DatabaseConnection();
    
    async create(card: CardDto): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            INSERT INTO card (id, user_id, name, active, flag)
            VALUES ($1, $2, $3, $4, $5)
            `, [card.id, card.userId, card.name, card.active, card.flag]);
    
        await client.end();
    };

    async findByUserId(userId: string): Promise<CardDto[] | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM card WHERE user_id = $1
            `, [userId]);
        
        
        await client.end();

        if(rows.length > 0){
            return rows.map((row) => {
                return {
                    id: row.id,
                    userId: row.user_id,
                    name: row.name,
                    active: row.active,
                    flag: row.flag
                }
            });
        };

        return undefined;
    };

    async findById(id: string): Promise<any | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM card WHERE id = $1
            `, [id]);
        
        await client.end();
        
        if(rows.length > 0){
            return rows.map((row) => {
                return {
                    id: row.id,
                    userId: row.user_id,
                    name: row.name,
                    active: row.active,
                    flag: row.flag
                }
            });
        };

        return undefined;
    };

    async update(card: any): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            UPDATE card SET name = $1, active = $2, flag=$3
            WHERE id = $4
            `, [card.name, card.active, card.flag, card.id]);

        await client.end();
    };
}
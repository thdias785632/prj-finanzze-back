import { CategoriesRepositoryInterface } from "../../../../app/@shared/categories/repository/categories-repository.interface";
import { CategoriesDto } from "../../../../domain/categories/dto/categories.dto";
import { DatabaseConnection } from "../../database/connection";

export class CategoriesRepository implements CategoriesRepositoryInterface {
    database = new DatabaseConnection();
    
    async create(category: CategoriesDto): Promise<void> {
        const client = this.database.connect();

        await client.connect();

        await client.query(
            `
            INSERT INTO Categories (id, user_id, name)
            VALUES ($1, $2, $3)
            `, [category.id, category.userId, category.name]);
    
        await client.end();
    };

    async findByUserId(userId: string): Promise<CategoriesDto[] | undefined> {
        const client = this.database.connect();

        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM categories WHERE user_id = $1
            `, [userId]);
        
        
        await client.end();

        if(rows.length > 0){
            return rows.map((row) => {
                return {
                    id: row.id,
                    userId: row.user_id,
                    name: row.name,
                }
            });
        };

        return undefined;
    };
}
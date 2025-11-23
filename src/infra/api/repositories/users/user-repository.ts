import { UserRepositoryInterface } from '../../../../app/@shared/users/repository/user-repository.interface';
import { UserDto } from '../../../../domain/users/dto/user.dto';
import { DatabaseConnection } from '../../database/connection';

export class UserRepository implements UserRepositoryInterface {
    database = new DatabaseConnection();
    
    async create(user: UserDto): Promise<void> {
        const client = this.database.connect();
        
        await client.connect();

        await client.query(
            `
            INSERT INTO users (id, name, email, password, created_at)
            VALUES ($1, $2, $3, $4, $5)
            `, [user.id, user.name, user.email, user.password, user.createdAt]);
        
        await client.end();
    };

    async findByEmail(email: string): Promise<UserDto | undefined> {
        const client = this.database.connect();
        
        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM users WHERE email = $1
            `, [email]);
        
        await client.end();

        if(rows.length > 0){
            return {
                id: rows[0].id,
                name: rows[0].name,
                email: rows[0].email,
                password: rows[0].password,
            }
        }

        return undefined;
    };

    async findAll(): Promise<UserDto[]> {
        const client = this.database.connect();
        
        await client.connect();

        const { rows } = await client.query(
            `
            SELECT * FROM users
            `, []);
        
        await client.end();

        return rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
        })); 
    };
}

export default UserRepository;
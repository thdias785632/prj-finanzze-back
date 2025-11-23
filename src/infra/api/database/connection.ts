import { Client } from 'pg';
import { IDatabaseConnection } from '../../../app/@shared/database/database.interface';
import { injectable } from 'inversify';
import dotenv from 'dotenv';

dotenv.config();

@injectable()
export class DatabaseConnection implements IDatabaseConnection {
    constructor() {}

    connect(): Client {
        const config = this.getEnvironments();
        
        const client = new Client(config);
        
        return client;
    }

    getEnvironments(): any {
        if (process.env.ENV === 'production') {
            return{
                user: process.env.DB_PROD_USER,
                password: process.env.DB_PROD_PASSWORD,
                host: process.env.DB_PROD_HOST,
                port: Number(process.env.DB_PROD_PORT),
                database: process.env.DB_PROD_DATABASE,
            }
        }

        return{
            user: process.env.DB_DEV_USER,
            password: process.env.DB_DEV_PASSWORD,
            host: process.env.DB_DEV_HOST,
            port: Number(process.env.DB_DEV_PORT),
            database: process.env.DB_DEV_DATABASE,
        }
    }
}

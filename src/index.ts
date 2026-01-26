import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from './infra/http/routes';
import dotenv from 'dotenv';
import './app/database-injection/injection';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from "./infra/http/swagger/swagger-output.json";
import cron from 'node-cron';
import { DailyReportService } from './app/services/daily-report/daily-report';
import { container } from './app/database-injection/injection';

dotenv.config();

console.log('Starting server...');
console.log('ENV:', process.env.ENV);
console.log('PORT:', process.env.PORT);

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(routes);

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ status: 'API is running on /api' });
});

app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const dbService = container.get('IDatabaseConnection') as any;
    const client = dbService.connect();
    await client.connect();
    await client.end();
    res.json({ status: 'OK', db: 'connected' });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'ERROR', db: 'disconnected', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});

cron.schedule('0 0 8 * * *', async() => {
  console.log('Running daily report job at', new Date().toISOString());
  
  try {
    const dailyReportService = container.get('DailyReportService') as DailyReportService;
    
    await dailyReportService.execute();

    console.log('Running daily completed');    
  } catch (error) {
    console.error('Error executing daily report service:', error);
  }
});
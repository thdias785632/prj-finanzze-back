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
import { PluggySyncUseCaseInterface } from './app/@shared/pluggy/usecase/pluggy.usecase.interface';

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

// Rede de segurança para a integração com a Pluggy: o mecanismo principal de sincronização
// é o webhook (near real-time, ver /api/pluggy/webhook). Esse cron existe apenas para o caso
// de algum webhook falhar/se perder (a Pluggy tenta reenviar 3x, mas não é garantido).
// Por isso roda de tempos em tempos (default 30min), e não a cada minuto: rodar a cada minuto
// bateria na API da Pluggy sem necessidade e sem trazer dado nenhum mais rápido.
const PLUGGY_SYNC_CRON = process.env.PLUGGY_SYNC_CRON || '*/30 * * * *';

cron.schedule(PLUGGY_SYNC_CRON, async () => {
  console.log('Running pluggy reconciliation job at', new Date().toISOString());

  try {
    const pluggySyncUseCase = container.get('PluggySyncUseCase') as PluggySyncUseCaseInterface;

    await pluggySyncUseCase.syncAllActiveConnections();

    console.log('Pluggy reconciliation completed');
  } catch (error) {
    console.error('Error executing pluggy reconciliation job:', error);
  }
});
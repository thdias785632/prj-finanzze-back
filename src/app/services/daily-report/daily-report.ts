import 'reflect-metadata';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { container } from '../../database-injection/injection';
import { injectable } from 'inversify';
import { inject } from 'inversify';
import { UserRepositoryInterface } from '../../@shared/users/repository/user-repository.interface';
import { CompleteExtractUseCaseInterface } from '../../@shared/extract/usecase/complete-extract.usecase.interface';

dotenv.config();

@injectable()
export class DailyReportService {
    SMTP_HOST = process.env.SMTP_HOST;
    SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    SMTP_USER = process.env.SMTP_USER;
    SMTP_PASS = process.env.SMTP_PASS;
    FROM_EMAIL = process.env.FROM_EMAIL;

    constructor(
      @inject('UserRepository')
      private userRepository: UserRepositoryInterface
    ) {}

    async execute(email?: string) {
        if (!this.SMTP_HOST || !this.SMTP_USER || !this.SMTP_PASS || !this.FROM_EMAIL) {
          console.error('Missing SMTP configuration in environment. Please check .env');
          
          process.exit(1);
        }

        await this.sendDailyReport(email);
    }
    
    private formatBRL(value: number | undefined) {
      if (!value && value !== 0) return '0,00';
      return value.toFixed(2).replace('.', ',');
    }
    
    private buildCategoriesGrouped(extract: any) {
      const groups: Record<string, number> = {};
    
      const push = (item: any) => {
        const cat = item.category || 'Outros';
        groups[cat] = (groups[cat] || 0) + Number(item.value || 0);
      };
    
      if (Array.isArray(extract.fixedExpensess)) extract.fixedExpensess.forEach(push);
      
      if (Array.isArray(extract.cardExpensess)) extract.cardExpensess.forEach(push);
    
      const labels = Object.keys(groups);
      const values = labels.map((l) => groups[l]);
    
      return { labels, values };
    }
    
    private async renderChartImage(extract: any) {
      const width = 800;
      const height = 600;
        
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

      const { labels, values } = this.buildCategoriesGrouped(extract);
    
      const currency = (v: number) => {
        if (!v && v !== 0) return 'R$ 0,00';
        
        return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      const backgroundColor = labels.map((_, i) => `hsl(${(i * 360) / (labels.length || 1)},70%,60%)`);

      const configuration = {
        type: 'doughnut' as const,
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: 'right',
              labels: {
                generateLabels: (chart: any) => {
                  const data = chart.data;
                  if (!data || !data.labels) return [];
                  const ds = data.datasets && data.datasets[0];
                  return (data.labels as string[]).map((label: string, i: number) => {
                    const v = ds && (ds.data as any)[i] ? Number((ds.data as any)[i]) : 0;
                    return {
                      text: `${label} — ${currency(v)}`,
                      fillStyle: ds && (ds.backgroundColor as any) ? (ds.backgroundColor as any)[i] : '#000',
                      hidden: false,
                      index: i,
                    } as any;
                  });
                },
              },
            },
            title: { display: true, text: 'Despesas por categoria' },
          },
        },
      };
    
      const image = await chartJSNodeCanvas.renderToBuffer(configuration as any);
      
      return image;
    }
    
    private async sendDailyReport(email?: string) {
      const completeExtractUseCase = container.get('CompleteExtractUseCase') as CompleteExtractUseCaseInterface;

      let users

      if (email) {
        users = [await this.userRepository.findByEmail(email) as any]
      } else {
        users = await this.userRepository.findAll();
      }

      for (const user of users) {
        const month = new Date().toISOString();
    
        const extract = await completeExtractUseCase.execute(user.id, month);
    
        const chartBuffer = await this.renderChartImage(extract);
    
        const revenuesHtml = (extract.revenues || [])
          .map((r: any) => `
          <tr>
              <td>${r.name}</td>
              <td>R$ ${this.formatBRL(r.value)}</td>
          </tr>
          `)
          .join('');
    
        const fixedExpensesHtml = (extract.fixedExpensess || [])
          .map((e: any) => `
            <tr>
                <td>${e.name}</td>
                <td>R$ ${this.formatBRL(e.value)}</td>
            </tr>
          `)
          .join('');

        const balanceHtml = `
            <tr>
                <td>${extract.totalRevenues}</td>
                <td>R$ ${this.formatBRL(extract.totalExpensess)}</td>
                <td>R$ ${this.formatBRL(extract.totalRevenues - extract.totalExpensess)}</td>
            </tr>
          `

        const cardExpensesHtml = (extract.cardExpensess || [])
          .map((e: any) => `
            <tr>
                <td>${e.name}</td>
                <td>R$ ${this.formatBRL(e.value)}</td>
            </tr>
          `)
          .join('');
    
        const html = `
          <html>
          <head>
            <style>
              :root{
                --primary:#6639A6;
                --primary-light:#F2EAFD;
                --secondary:#A583D4;
                --red-500:#B20000;
                --green-500:#007505;
                --blue-500:#0065C1;
              }
              
              html, body {
                background-color: #f4f4f4;
                width: 100%;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              }

              h2.item-title {
                color: var(--primary);
                margin-top: 30px;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: 600;
              }

              table {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                border-collapse: collapse;
                width: 100%;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                margin-bottom: 20px;
              }

              table thead {
                background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
              }

              table thead th {
                color: var(--primary-light);
                padding: 14px 16px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
                letter-spacing: 0.5px;
              }

              table tbody tr {
                border-bottom: 1px solid #e8e8e8;
                transition: background-color 0.2s ease;
              }

              table tbody tr:hover {
                background-color: var(--primary-light);
              }

              table tbody tr:last-child {
                border-bottom: none;
              }

              table td {
                padding: 12px 16px;
                color: var(--primary-light);
                font-size: 14px;
              }

              table td:last-child {
                text-align: right;
                font-weight: 500;
                color: var(--primary);
              }
            </style>
          </head>
          <body>
            <h2 class="item-title">Receitas</h2>
            
            <table>
              <thead>
                  <tr>
                      <th>Nome</th>
                      <th>Valor</th>
                  </tr>
              </thead>
              <tbody>
                  ${revenuesHtml}
              </tbody>
            </table>

            <h2 class="item-title">Despesas</h2>
            
            <table>
              <thead>
                  <tr>
                      <th>Nome</th>
                      <th>Valor</th>
                  </tr>
              </thead>
              <tbody>
                  ${fixedExpensesHtml}
              </tbody>
            </table>

            <h2 class="item-title">Despesas do Cartão</h2>
            
            <table>
              <thead>
                  <tr>
                      <th>Nome</th>
                      <th>Valor</th>
                  </tr>
              </thead>
              <tbody>
                  ${cardExpensesHtml}
              </tbody>
            </table>

            <h2 class="item-title">Balanço</h2>
            
            <table>
              <thead>
                  <tr>
                      <th>Receita</th>
                      <th>Despesas</th>
                      <th>Saldo</th>
                  </tr>
              </thead>
              <tbody>
                  ${balanceHtml}
              </tbody>
            </table>
    
            <div class="extract-item chart-extract">
              <h1>Categorias</h1>
              <div class="chart-extract__item">
                <img src="cid:chart@finanzze" alt="Chart" />
              </div>
            </div>
          </body>
          </html>
        `;
    
        const transporter = nodemailer.createTransport({
          host: this.SMTP_HOST,
          port: this.SMTP_PORT,
          secure: this.SMTP_PORT === 465,
          auth: {
            user: this.SMTP_USER,
            pass: this.SMTP_PASS,
          },
        });
    
        const mailOptions = {
          from: this.FROM_EMAIL,
          to: user.email,
          subject: `Relatório - Balanço em ${new Date().toLocaleDateString()}`,
          html,
          attachments: [
            {
              filename: 'gráfico_extrato.png',
              content: chartBuffer,
              cid: 'chart@finanzze',
            },
          ],
        } as any;
    
        await transporter.sendMail(mailOptions);
      }
    }
}


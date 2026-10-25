# Integração Pluggy (Open Finance) — Finanzze Backend

Importa automaticamente as despesas de cartão de crédito do usuário a partir da Pluggy e grava em `card_expenses`, usando o mesmo `CardExpensesUseCase` da rota `POST` manual.

> **Sobre os exemplos de payload deste documento:** foram montados a partir da documentação oficial da Pluggy (https://docs.pluggy.ai) e do formato esperado pelo código. Não são capturas de tráfego real. Quando você rodar com dados reais, copie os payloads reais do inspector do ngrok (`http://127.0.0.1:4040`) e substitua os exemplos abaixo.

---

## 1. Visão geral

```
 Banco ──(Open Finance)──► Pluggy ──(webhook HTTPS)──► POST /api/pluggy/webhook ──► card_expenses
                              ▲                                    │
                              └────── GET /v2/transactions, /accounts, /items ◄── nossa API (PluggyClient)
```

Três mecanismos trabalham juntos:

| Mecanismo | Quando roda | Papel |
|---|---|---|
| **Busca retroativa** | 1x, ao conectar um Item (`POST /api/pluggy/connections`) | Traz o histórico inteiro de cada cartão |
| **Webhook** (`POST /api/pluggy/webhook`) | Sempre que a Pluggy detecta mudança | Mecanismo principal, quase tempo real |
| **Cron de reconciliação** | A cada 30 min (`PLUGGY_SYNC_CRON`) | Rede de segurança se um webhook se perder |

Por que não polling a cada minuto: a Pluggy só coleta dados do banco periodicamente (a cada 8/12/24h conforme o plano). Consultar a cada minuto não traria dado novo antes disso e gastaria rate limit. O webhook avisa quando há novidade.

### Conceitos Pluggy usados
- **Item**: a conexão de um usuário com uma instituição (ex.: Nubank). Tem `itemId`.
- **Account**: conta dentro do Item. Usamos só `type = CREDIT` (cada uma vira um `card` nosso).
- **Transaction**: uma compra/lançamento da conta.

### Mapeamento para o nosso banco
| Pluggy | Finanzze |
|---|---|
| Item | `pluggy_items` (1 linha por Item/usuário) |
| Account CREDIT | `card` (colunas `pluggy_item_id`, `pluggy_account_id`) |
| Transaction | `card_expenses` (coluna `pluggy_transaction_id`, UNIQUE) |
| `abs(amount)` | `value` (sempre positivo, como no cadastro manual) |
| `description` | `name` |
| `date` | `reference_date` |
| `category` | `category` (traduzida por `CATEGORY_MAP`; limitada a 15 caracteres) |
| `creditCardMetadata.totalInstallments` | `installments` |

Idempotência: `pluggy_transaction_id` é UNIQUE e o insert usa `ON CONFLICT DO NOTHING`, então receber o mesmo evento duas vezes (retry da Pluggy, cron + webhook) não duplica despesas.

---

## 2. Arquivos da implementação

| Camada | Arquivo |
|---|---|
| Migration | `sql/2026-08-08_create-pluggy.sql` |
| Cliente HTTP Pluggy | `src/infra/api/pluggy/pluggy-client.ts` |
| Repositório de conexões | `src/infra/api/repositories/pluggy/pluggy-connection-repository.ts` |
| Usecase de conexão | `src/app/usecases/pluggy/pluggy-connection.usecase.ts` |
| Usecase de sincronização | `src/app/usecases/pluggy/pluggy-sync.usecase.ts` |
| Controllers | `src/presentation/controllers/pluggy/*.ts` |
| Rotas | `src/infra/http/routes/pluggy.routes.ts` (`/api/pluggy`) |
| Cron | `src/index.ts` |
| Env | `.env.example` |

---

## 3. Configuração

Variáveis (`.env`):

```
PLUGGY_CLIENT_ID=...
PLUGGY_CLIENT_SECRET=...
PLUGGY_BASE_URL=https://api.pluggy.ai
PLUGGY_WEBHOOK_URL=https://SEU-DOMINIO/api/pluggy/webhook
PLUGGY_SYNC_CRON=*/30 * * * *
PLUGGY_RECONCILE_LOOKBACK_DAYS=3
```

Passos: rodar a migration → preencher o `.env` → subir o servidor → conectar um Item (seção 4).
`PLUGGY_WEBHOOK_URL` precisa ser pública (em dev, ngrok). Se a URL do ngrok mudar, atualize o `.env` e chame `POST /api/pluggy/connections` de novo (registra a nova URL; webhooks antigos não são removidos automaticamente — apague-os no dashboard da Pluggy).

---

## 4. Fluxo de conexão (1ª vez de um usuário)

### 4.1 Obter o `itemId`
- **Sandbox/demo**: criar o Item via API ou dashboard (ver `test-pluggy-flow.sh`; credenciais do conector sandbox: `user-ok` / `password-ok`).
- **Dados reais (produção)**: o usuário precisa autorizar o banco pelo **widget Pluggy Connect**, que roda no frontend e usa um *connect token* gerado pelo backend. **Isso ainda não está implementado**: hoje o backend só recebe um `itemId` pronto. Para usuários reais será necessário (a) um endpoint que gere o connect token (`POST /connect_token` na Pluggy) e (b) o widget no frontend, que devolve o `itemId` ao final. Também é preciso contratar/habilitar o ambiente de produção na Pluggy.

### 4.2 Vincular ao usuário

```http
POST /api/pluggy/connections
Content-Type: application/json

{ "userId": "b0d7c1de-...-usuario", "itemId": "8f4e1b3a-2c7d-4f10-9a55-0c1d2e3f4a5b" }
```

Resposta: `201 { "message": "Item Pluggy conectado e sincronizado com sucesso" }`

O que acontece internamente (`PluggyConnectionUseCase.connectItem`):
1. `GET /items/{itemId}` → grava status em `pluggy_items`.
2. `GET /accounts?itemId=...` → para cada conta `CREDIT`, cria um `card` (nome = `marketingName`/`name`, bandeira = `creditData.brand`) se ainda não existir.
3. Busca retroativa: pagina `GET /v2/transactions?accountId=...` (cursor) e grava cada transação.
4. Registra os webhooks (`transactions/created`, `transactions/updated`, `transactions/deleted`, `item/updated`) apontando para `PLUGGY_WEBHOOK_URL`.

Exemplo de conta retornada pela Pluggy (resumido):

```json
{
  "id": "3a1f0c2e-9d44-4a7b-8c55-1b2c3d4e5f60",
  "itemId": "8f4e1b3a-2c7d-4f10-9a55-0c1d2e3f4a5b",
  "type": "CREDIT",
  "subtype": "CREDIT_CARD",
  "name": "Cartão Mastercard Black",
  "marketingName": "Mastercard Black",
  "creditData": { "brand": "MASTERCARD", "creditLimit": 15000, "availableCreditLimit": 11250.4 }
}
```

Exemplo de transação e como vira despesa:

```json
{
  "id": "c9e2b7a4-61d3-4b8e-a0f2-77d1c3e9aa12",
  "accountId": "3a1f0c2e-9d44-4a7b-8c55-1b2c3d4e5f60",
  "description": "Netflix.com",
  "amount": -55.9,
  "date": "2026-10-20T00:00:00.000Z",
  "category": "Entertainment",
  "type": "DEBIT",
  "status": "POSTED",
  "creditCardMetadata": { "installmentNumber": 1, "totalInstallments": 1 }
}
```

→ vira em `card_expenses`:

| name | value | reference_date | category | installments | recurrent | pluggy_transaction_id |
|---|---|---|---|---|---|---|
| Netflix.com | 55.90 | 2026-10-20 | Lazer | 1 | false | c9e2b7a4-... |

---

## 5. Dia a dia: o que acontece quando o usuário compra algo

Exemplo cronológico (horários ilustrativos):

1. **12:03** — Usuário compra R$ 89,90 no iFood com o cartão.
2. **12:03–~20:00** — O banco registra o lançamento. A Pluggy ainda não sabe; só coleta no próximo ciclo de auto-sync do plano (a cada 8/12/24h) ou quando alguém dispara um update do Item.
3. **~20:00** — A Pluggy sincroniza o Item, detecta 1 transação nova e envia:

```http
POST https://SEU-DOMINIO/api/pluggy/webhook
Content-Type: application/json

{
  "event": "transactions/created",
  "eventId": "e1a2b3c4-d5e6-4f70-8192-a3b4c5d6e7f8",
  "itemId": "8f4e1b3a-2c7d-4f10-9a55-0c1d2e3f4a5b",
  "accountId": "3a1f0c2e-9d44-4a7b-8c55-1b2c3d4e5f60",
  "transactionsCreatedAtFrom": "2026-10-25T20:00:00.000Z",
  "createdTransactionsLink": "https://api.pluggy.ai/transactions?accountId=3a1f0c2e-...&createdAtFrom=2026-10-25T20%3A00%3A00.000Z"
}
```

4. **Nossa API** responde `200 {"received": true}` imediatamente (a Pluggy exige 2XX em até 5s; senão reenvia até 3x, 1 min entre tentativas).
5. **Em background**: `PluggySyncUseCase.syncFromCreatedLink` busca o `createdTransactionsLink` (com a `X-API-KEY`), acha o `card` pelo `accountId`, e chama `CardExpensesUseCase.create` — o mesmo caminho do `POST` manual.
6. A despesa aparece no app do usuário, sem ele cadastrar nada.

Outros eventos tratados:

| Evento | Payload relevante | Ação |
|---|---|---|
| `transactions/created` | `createdTransactionsLink` | Busca e insere as novas |
| `transactions/updated` | `transactionIds[]` | Busca por id e atualiza (ex.: PENDING → POSTED, valor/descrição ajustados) |
| `transactions/deleted` | `transactionIds[]` | Remove de `card_expenses` |
| `item/updated`, `item/created` | `itemId` | Atualiza status/execution_status em `pluggy_items` |
| outros | — | Logados e ignorados |

### Cron de reconciliação
A cada 30 min (`PLUGGY_SYNC_CRON`), para cada Item ativo (`status != LOGIN_ERROR`): consulta o Item, busca as transações dos últimos `PLUGGY_RECONCILE_LOOKBACK_DAYS` (3) dias de cada cartão e grava as que faltarem (as que já existem são atualizadas, sem duplicar). Cobre webhooks perdidos.

---

## 6. Operação e troubleshooting

Conferir no banco:
```sql
SELECT item_id, status, execution_status, webhook_registered, last_synced_at FROM pluggy_items;
SELECT id, name, flag, pluggy_account_id FROM card WHERE pluggy_account_id IS NOT NULL;
SELECT name, value, reference_date, category, pluggy_transaction_id
  FROM card_expenses WHERE pluggy_transaction_id IS NOT NULL ORDER BY reference_date DESC LIMIT 20;
```

| Sintoma | Causa provável |
|---|---|
| Webhook nunca chega | `PLUGGY_WEBHOOK_URL` desatualizada (ngrok mudou), túnel fora do ar, ou webhook não registrado (`GET /webhooks` na Pluggy) |
| Despesas não aparecem após o webhook | Ver logs `[pluggy-webhook] Falha ao processar evento ...`; conta sem `card` vinculado é ignorada de propósito |
| Item com `LOGIN_ERROR` / `OUTDATED` | Credenciais do usuário no banco expiraram/mudaram: o usuário precisa reconectar pelo widget (modo update). O cron ignora itens `LOGIN_ERROR` |
| `403` da Pluggy | apiKey expirada; o cliente renova sozinho e tenta 1x |
| Erro `value too long` na categoria | Categoria > 15 caracteres: adicionar ao `CATEGORY_MAP` (o fallback já trunca em 15) |

Ferramentas: inspector do ngrok (`http://127.0.0.1:4040`) para ver/reenviar webhooks; `test-pluggy-flow.sh` para testar o fluxo no sandbox.

---

## 7. Limitações conhecidas / próximos passos

- **Código ainda não compilado nem testado ponta a ponta**: validar com `npm run build` e com o sandbox antes de produção.
- **Sem widget/connect token**: necessário para conectar bancos reais (seção 4.1).
- **Webhook sem autenticação**: qualquer um que descubra a URL pode postar eventos. Mitigação sugerida: segredo na URL (`/api/pluggy/webhook?token=...`) validado no controller.
- **Endpoint `/transactions` deprecated**: o `createdTransactionsLink` e o fetch por ids usam o endpoint antigo, que a documentação da Pluggy indica ser descontinuado (data a confirmar na documentação, citada como 31/12/2026). Migrar para `/v2/transactions` antes disso.
- **Formato do `GET /v2/transactions`** (campo do cursor) foi tratado de forma defensiva (`nextCursor` ou `cursor`); confirmar no OpenAPI da Pluggy.
- **Parcelas**: guardamos só o total de parcelas (`installments`), não a parcela atual.
- **Sem cartão com `pluggy_account_id` duplicado entre usuários**: a coluna é UNIQUE.
- **Item/updated** só atualiza status; não dispara sync por si só.
- Cada query abre/fecha uma conexão `pg` (padrão do projeto); em sincronizações grandes isso é lento. Considerar pool.

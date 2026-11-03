# Imóveis e correção pelo INCC

Substitui a antiga seção de Investimentos (as tabelas `investimentos` e `categorias_investimento` **não** são apagadas; veja o comentário no fim da migration `sql/2026-11-02_create-imoveis.sql`).

## Modelo
- **Imóvel**: nome, construtora, valor do contrato, data do contrato, **mês-base do INCC**, **defasagem (meses)**, entrega das chaves e início do financiamento.
- **Fluxo de pagamento** (grupo): tipo (`ENTRADA`, `MENSAIS`, `INTERMEDIARIAS`, `CHAVES`, `FINANCIAMENTO`, `OUTRO`), quantidade de parcelas, valor-base da parcela, 1º vencimento, periodicidade em meses (1 mensal, 6 semestral, 12 anual) e índice (`INCC` ou `NONE`; financiamento nasce como `NONE`).
- **Parcela**: gerada a partir do fluxo. Tem valor-base, vencimento, e (quando paga) data e valor pago.

## Como o INCC é aplicado
Para cada parcela com índice `INCC`:

```
mês de referência = mês do vencimento − defasagem          (ex.: vence 10/set, defasagem 2 → INCC de julho)
fator             = Π (1 + variação_m/100)  para m = mês-base+1 … mês de referência
valor corrigido   = valor-base × fator
```
Isso equivale a `INCC(referência) / INCC(base)`. Se o mês de referência for igual ou anterior ao mês-base, não há correção. Se algum mês ainda não foi divulgado, o fator usa até o último mês disponível e a parcela vem com `estimated: true`.

- A **defasagem** (`inccLagMonths`, 0 a 12, padrão 2) e o **mês-base** (`inccBaseMonth`) são editáveis por imóvel (`PUT /api/imoveis`); como o valor é calculado na leitura, nada precisa ser recriado.
- Ao **marcar como paga**, o valor corrigido daquele momento é congelado em `paid_amount` (ou o usuário informa o valor realmente pago).
- Contratos variam (índice por número-índice vs. variação mensal, arredondamentos, mês-base). Confira a primeira parcela corrigida com o boleto e ajuste base/defasagem se precisar.

## Fonte do índice
API pública do Banco Central (SGS), série **192 – INCC, variação % mensal**: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa` (máx. 10 anos por consulta).
- Sincroniza ao subir o servidor e todo dia às 07:00 (`INDICES_SYNC_CRON`).
- Ao cadastrar um imóvel, busca o histórico desde o mês-base se faltar.
- Se o BCB estiver indisponível, informe o mês manualmente: `PUT /api/indices/incc {"month":"2026-09","variation":0.22}` (valores manuais não são sobrescritos pelo BCB).

## Endpoints (`/api`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/imoveis` | cria imóvel com `fluxos: [...]` |
| GET | `/imoveis/get-by-user?userId=` | resumo (pago, restante corrigido, próxima parcela, valor a financiar) |
| GET | `/imoveis/get-by-id?id=&userId=` | detalhe: fluxos e parcelas com `correctedAmount`, `referenceMonth`, `estimated` |
| PUT | `/imoveis` | edita (inclui `inccLagMonths`, `inccBaseMonth`) |
| DELETE | `/imoveis?id=&userId=` | remove |
| POST / DELETE | `/imoveis/fluxos` | adiciona / remove fluxo (não remove se houver parcela paga) |
| PATCH | `/imoveis/parcelas/pay` · `/unpay` | baixa / desfaz pagamento |
| PUT | `/imoveis/parcelas` | edita valor-base ou vencimento de parcela em aberto |
| GET | `/indices/incc?from=&to=` | variações mensais |
| POST | `/indices/incc/sync` | força sincronização com o BCB |
| PUT | `/indices/incc` | informa um mês manualmente |

Exemplo de criação:
```json
{
  "userId": "...", "name": "Apto 1201", "developer": "Construtora X", "totalValue": 800000,
  "contractDate": "2024-03-15", "inccBaseMonth": "2024-03", "inccLagMonths": 2,
  "deliveryDate": "2027-06-30", "financingStartDate": "2027-07-10",
  "fluxos": [
    { "type": "ENTRADA", "installmentsCount": 1, "installmentAmount": 80000, "firstDueDate": "2024-03-20" },
    { "type": "MENSAIS", "installmentsCount": 36, "installmentAmount": 3000, "firstDueDate": "2024-04-10" },
    { "type": "INTERMEDIARIAS", "installmentsCount": 3, "installmentAmount": 20000, "firstDueDate": "2024-12-15", "periodicityMonths": 12 },
    { "type": "FINANCIAMENTO", "installmentsCount": 120, "installmentAmount": 5000, "firstDueDate": "2027-08-10" }
  ]
}
```
Limitação: as parcelas do financiamento (tabela Price/SAC com juros e TR) são tratadas como valores informados pelo usuário; o app não simula o financiamento.

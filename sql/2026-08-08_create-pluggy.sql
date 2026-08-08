-- Tabela que guarda cada "Item" (conexão bancária) da Pluggy vinculado a um usuário.
-- Um Item pode ter várias contas (accounts); cada conta CREDIT vira um "card" nosso.
CREATE TABLE IF NOT EXISTS pluggy_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id VARCHAR(255) NOT NULL UNIQUE,       -- id do Item na Pluggy
  connector_id INTEGER,
  connector_name VARCHAR(255),
  status VARCHAR(50),                         -- UPDATED, LOGIN_ERROR, OUTDATED, etc (espelha o status da Pluggy)
  execution_status VARCHAR(50),
  webhook_registered BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pluggy_items_user_id ON pluggy_items(user_id);

-- Vincula um card nosso à conta de cartão de crédito correspondente na Pluggy.
ALTER TABLE card ADD COLUMN IF NOT EXISTS pluggy_item_id UUID REFERENCES pluggy_items(id);
ALTER TABLE card ADD COLUMN IF NOT EXISTS pluggy_account_id VARCHAR(255) UNIQUE;

-- Guarda o id da transação na Pluggy em cada despesa importada, para evitar duplicidade
-- quando o mesmo evento (webhook) ou a reconciliação do cron rodar mais de uma vez.
ALTER TABLE card_expenses ADD COLUMN IF NOT EXISTS pluggy_transaction_id VARCHAR(255) UNIQUE;
ALTER TABLE card_expenses ALTER COLUMN installments DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_card_expenses_pluggy_transaction_id ON card_expenses(pluggy_transaction_id);

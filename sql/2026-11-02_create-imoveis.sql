-- Seção de Imóveis (substitui Investimentos). As tabelas antigas de investimentos NÃO são apagadas aqui;
-- se quiser removê-las depois de conferir, rode manualmente:
--   DROP TABLE IF EXISTS investimentos; DROP TABLE IF EXISTS categorias_investimento;

CREATE TABLE IF NOT EXISTS imoveis (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  developer VARCHAR(255),                       -- construtora/incorporadora
  address VARCHAR(500),
  total_value NUMERIC(14,2) NOT NULL,           -- valor do contrato (sem correção)
  contract_date DATE NOT NULL,
  incc_base_month DATE NOT NULL,                -- mês-base do índice (sempre dia 01)
  incc_lag_months SMALLINT NOT NULL DEFAULT 2,  -- defasagem: parcela de março usa o INCC de janeiro (2)
  delivery_date DATE,                           -- entrega das chaves
  financing_start_date DATE,                    -- quando passa a ser financiado
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_imoveis_user_id ON imoveis(user_id);

-- Grupos de pagamento do contrato (entrada, mensais, intermediárias, chaves, financiamento...)
CREATE TABLE IF NOT EXISTS imovel_fluxos (
  id UUID PRIMARY KEY,
  imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL,                    -- ENTRADA | MENSAIS | INTERMEDIARIAS | CHAVES | FINANCIAMENTO | OUTRO
  description VARCHAR(255) NOT NULL,
  installments_count INTEGER NOT NULL,
  installment_amount NUMERIC(14,2) NOT NULL,    -- valor-base de cada parcela (antes da correção)
  first_due_date DATE NOT NULL,
  periodicity_months SMALLINT NOT NULL DEFAULT 1, -- 1 mensal, 6 semestral, 12 anual
  index_type VARCHAR(10) NOT NULL DEFAULT 'INCC', -- INCC | NONE
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imovel_fluxos_imovel_id ON imovel_fluxos(imovel_id);

-- Parcelas geradas a partir de cada fluxo; o valor corrigido é calculado na leitura.
CREATE TABLE IF NOT EXISTS imovel_parcelas (
  id UUID PRIMARY KEY,
  imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  fluxo_id UUID NOT NULL REFERENCES imovel_fluxos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  base_amount NUMERIC(14,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at DATE,
  paid_amount NUMERIC(14,2),                    -- valor efetivamente pago (congela o valor corrigido na baixa)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_imovel_parcelas_imovel_id ON imovel_parcelas(imovel_id);
CREATE INDEX IF NOT EXISTS idx_imovel_parcelas_user_due ON imovel_parcelas(user_id, due_date);

-- Variação mensal (%) de índices econômicos. INCC = série SGS 192 do Banco Central.
CREATE TABLE IF NOT EXISTS indices_economicos (
  series VARCHAR(20) NOT NULL,                  -- 'INCC'
  ref_month DATE NOT NULL,                      -- primeiro dia do mês de referência
  variation NUMERIC(10,4) NOT NULL,             -- variação % no mês
  source VARCHAR(10) NOT NULL DEFAULT 'BCB',    -- BCB | MANUAL (manual não é sobrescrito pela sincronização)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (series, ref_month)
);

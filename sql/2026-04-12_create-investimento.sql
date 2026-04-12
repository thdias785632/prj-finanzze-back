CREATE TABLE categorias_investimento (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_percentage DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE investimentos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria_id UUID REFERENCES categorias_investimento(id),
  name VARCHAR(255) NOT NULL,
  current_value DOUBLE PRECISION NOT NULL,
  target_percentage DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE investimentos ADD COLUMN IF NOT EXISTS quantity      DOUBLE PRECISION;
ALTER TABLE investimentos ADD COLUMN IF NOT EXISTS average_price DOUBLE PRECISION;
ALTER TABLE investimentos ADD COLUMN IF NOT EXISTS current_price DOUBLE PRECISION;
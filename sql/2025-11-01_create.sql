CREATE TABLE IF NOT EXISTS users(
    id uuid,
    name character varying,
	email character varying, 
	password character varying,
	created_at date
); 

CREATE TABLE IF NOT EXISTS card (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  flag VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS card_expenses (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  installments INTEGER NOT NULL,
  reference_date DATE NOT NULL,
  active BOOLEAN NOT NULL,
  recurrent BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  value DOUBLE PRECISION NOT NULL CHECK (value >= 0),
  reference_date DATE NOT NULL,
  active BOOLEAN NOT NULL,
  recurrent BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS revenues (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  reference_date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  active BOOLEAN NOT NULL,
  recurrent BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  base_mint TEXT NOT NULL,
  quote_mint TEXT NOT NULL,
  side TEXT NOT NULL,
  amount_in NUMERIC NOT NULL,
  limit_price NUMERIC,
  chosen_dex TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  status TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
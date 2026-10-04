CREATE TABLE transactions (
    signature      TEXT PRIMARY KEY,
    slot           BIGINT NOT NULL,
    block_time     TIMESTAMPTZ,
    fee_payer      TEXT NOT NULL,
    success        BOOLEAN NOT NULL,
    raw            JSONB NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tx_fee_payer ON transactions(fee_payer);
CREATE INDEX idx_tx_slot ON transactions(slot);

CREATE TABLE alerts (
    id             BIGSERIAL PRIMARY KEY,
    signature      TEXT REFERENCES transactions(signature),
    rule_id        TEXT NOT NULL,
    severity       SMALLINT NOT NULL,
    target_address TEXT,
    explanation    TEXT,
    status         TEXT DEFAULT 'open',
    created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

CREATE TABLE flagged_addresses (
    address        TEXT PRIMARY KEY,
    category       TEXT NOT NULL,
    risk_score     SMALLINT NOT NULL,
    first_seen     TIMESTAMPTZ DEFAULT now(),
    on_chain_tx    TEXT,
    evidence       JSONB
);

CREATE TABLE scan_reports (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ref     TEXT NOT NULL,
    findings       JSONB NOT NULL,
    summary        TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shield_checks (
    id             BIGSERIAL PRIMARY KEY,
    wallet         TEXT NOT NULL,
    verdict        TEXT NOT NULL,
    risk_score     SMALLINT NOT NULL,
    summary        TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS quotas (
 bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
 id TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id), rule_version TEXT NOT NULL,
 state TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0, ticks INTEGER NOT NULL DEFAULT 0,
 wealth REAL NOT NULL DEFAULT 0, survival_days INTEGER NOT NULL DEFAULT 0,
 highest_cash REAL NOT NULL DEFAULT 0, total_revenue REAL NOT NULL DEFAULT 0, terminal INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, last_request TEXT
);
CREATE INDEX IF NOT EXISTS runs_player ON runs(player_id,created_at);
CREATE INDEX IF NOT EXISTS runs_wealth ON runs(rule_version,wealth DESC,survival_days DESC);
CREATE INDEX IF NOT EXISTS runs_survival ON runs(rule_version,survival_days DESC,wealth DESC);
CREATE TABLE IF NOT EXISTS receipts (
 run_id TEXT NOT NULL, request_id TEXT NOT NULL, digest TEXT NOT NULL, seq INTEGER NOT NULL,
 response TEXT NOT NULL, PRIMARY KEY(run_id,request_id)
);

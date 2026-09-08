CREATE TABLE IF NOT EXISTS endorsements (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, email TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined')),
 created_at INTEGER NOT NULL, reviewed_at INTEGER, approval_token_hash TEXT UNIQUE,
 token_expires_at INTEGER NOT NULL, request_key TEXT NOT NULL UNIQUE,
 request_hash TEXT NOT NULL, email_sent_at INTEGER
);
CREATE INDEX IF NOT EXISTS endorsements_public ON endorsements(status,reviewed_at);

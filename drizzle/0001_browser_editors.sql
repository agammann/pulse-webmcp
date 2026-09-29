CREATE TABLE IF NOT EXISTS case_owners (repair_case_id TEXT PRIMARY KEY, session_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS browser_votes (repair_case_id TEXT NOT NULL, session_hash TEXT NOT NULL, vote_type TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(repair_case_id, session_hash, vote_type));

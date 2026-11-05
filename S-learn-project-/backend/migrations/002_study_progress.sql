CREATE TABLE IF NOT EXISTS study_activity (
    user_id TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    completed_count INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    best_score_total INTEGER NOT NULL DEFAULT 0,
    last_completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, subject, topic)
);

CREATE INDEX IF NOT EXISTS study_activity_user_idx ON study_activity (user_id);

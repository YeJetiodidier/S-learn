CREATE TABLE IF NOT EXISTS schedule_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS schedule_items_user_idx ON schedule_items (user_id, created_at DESC);

ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS favorite_cards TEXT[] NOT NULL DEFAULT '{}'::text[];

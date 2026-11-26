ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS notif_platform_updates BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES app_users(uid) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'platform'
        CHECK (category IN ('paper', 'video', 'platform', 'schedule')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT NOT NULL DEFAULT '',
    created_by TEXT REFERENCES app_users(uid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
    ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_category_created_idx
    ON notifications (category, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_reads (
    user_id TEXT NOT NULL REFERENCES app_users(uid) ON DELETE CASCADE,
    notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_id)
);

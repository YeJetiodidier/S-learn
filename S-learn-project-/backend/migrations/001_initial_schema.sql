CREATE TABLE IF NOT EXISTS app_users (
    uid TEXT PRIMARY KEY,
    email TEXT,
    username TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'Student',
    avatar_url TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    level TEXT NOT NULL DEFAULT '',
    specialty TEXT NOT NULL DEFAULT '',
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    topics_studied INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES app_users(uid) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'light',
    accent_color TEXT NOT NULL DEFAULT '#8b5cf6',
    font_size TEXT NOT NULL DEFAULT 'medium',
    compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
    notif_schedule_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    notif_new_papers BOOLEAN NOT NULL DEFAULT TRUE,
    notif_video_uploads BOOLEAN NOT NULL DEFAULT FALSE,
    notif_weekly_report BOOLEAN NOT NULL DEFAULT TRUE,
    notif_email_digest BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_profile_visible BOOLEAN NOT NULL DEFAULT TRUE,
    privacy_activity_visible BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_share_stats BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL DEFAULT '',
    specialty TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    paper_name TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved')),
    submitted_by TEXT REFERENCES app_users(uid) ON DELETE SET NULL,
    approved_by TEXT REFERENCES app_users(uid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS papers_status_year_idx ON papers (status, year DESC);
CREATE INDEX IF NOT EXISTS papers_subject_idx ON papers (subject);

CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved')),
    submitted_by TEXT REFERENCES app_users(uid) ON DELETE SET NULL,
    approved_by TEXT REFERENCES app_users(uid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS videos_status_created_idx ON videos (status, created_at DESC);
CREATE INDEX IF NOT EXISTS videos_subject_idx ON videos (subject);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questions_subject_topic_idx ON questions (subject, topic);

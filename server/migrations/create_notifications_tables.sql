-- Migration pour le système de notifications
-- À exécuter via: GET /api/admin/run-notification-migration

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  channels JSONB NOT NULL DEFAULT '["in-app"]',
  sent_channels JSONB NOT NULL DEFAULT '["in-app"]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  enable_in_app BOOLEAN NOT NULL DEFAULT true,
  enable_email BOOLEAN NOT NULL DEFAULT true,
  enable_push BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_type UNIQUE (user_id, notification_type)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

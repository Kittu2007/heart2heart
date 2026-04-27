-- Add preference fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT TRUE;

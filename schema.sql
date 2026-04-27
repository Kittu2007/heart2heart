-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  couple_id UUID,
  onboarding_done BOOLEAN DEFAULT FALSE,
  comfort_level SMALLINT DEFAULT 3 CHECK (comfort_level BETWEEN 1 AND 5),
  is_admin BOOLEAN DEFAULT FALSE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Couples
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code TEXT UNIQUE NOT NULL,
  partner_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  task_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_couple;
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_couple
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE SET NULL;

-- 3. Onboarding Responses
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  love_languages TEXT[] NOT NULL,
  interests TEXT[] NOT NULL,
  schedule JSONB,
  communication_style TEXT,
  open_to TEXT[],
  raw_answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily Tasks
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  intensity SMALLINT CHECK (intensity BETWEEN 1 AND 5),
  generated_date DATE NOT NULL,
  ai_prompt_hash TEXT,
  completed BOOLEAN DEFAULT FALSE,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, generated_date)
);

-- 5. Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feeling_tag TEXT,
  feelings TEXT[], -- Compatibility with arrays
  comment TEXT,
  free_text TEXT,
  sentiment_score REAL CHECK (sentiment_score BETWEEN -1.0 AND 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Mood Checkins
CREATE TABLE IF NOT EXISTS mood_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  emoji TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  share_with_partner BOOLEAN DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Memories
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  caption TEXT,
  image_url TEXT NOT NULL,
  memory_date TIMESTAMPTZ DEFAULT NOW(),
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Events (Standard)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('date', 'countdown', 'message')),
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Couple Dates (Legacy/Alternative)
CREATE TABLE IF NOT EXISTS couple_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Scheduled Events (My Addition)
CREATE TABLE IF NOT EXISTS scheduled_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Locked Messages
CREATE TABLE IF NOT EXISTS locked_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  unlock_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_couple_date ON daily_tasks(couple_id, generated_date);
CREATE INDEX IF NOT EXISTS idx_memories_couple_id ON memories(couple_id);
CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_couple_id ON events(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_dates_couple_id ON couple_dates(couple_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_couple_id ON scheduled_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_locked_messages_couple_id ON locked_messages(couple_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_messages ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for the partner context)
CREATE POLICY "Profiles access" ON profiles FOR ALL USING (id = auth.uid() OR couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Couples access" ON couples FOR ALL USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid());
CREATE POLICY "Onboarding access" ON onboarding_responses FOR ALL USING (user_id = auth.uid() OR couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Daily tasks access" ON daily_tasks FOR ALL USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Feedback access" ON feedback FOR ALL USING (user_id = auth.uid() OR couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Mood checkins access" ON mood_checkins FOR ALL USING (user_id = auth.uid() OR couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Memories access" ON memories FOR ALL USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Events access" ON events FOR ALL USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Couple dates access" ON couple_dates FOR ALL USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Scheduled events access" ON scheduled_events FOR ALL USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Locked messages access" ON locked_messages FOR ALL USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

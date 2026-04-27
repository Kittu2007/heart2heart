CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  couple_id UUID,
  onboarding_done BOOLEAN DEFAULT FALSE,
  comfort_level SMALLINT DEFAULT 3 CHECK (comfort_level BETWEEN 1 AND 5),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code TEXT UNIQUE NOT NULL,
  partner_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_couple;
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_couple
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE SET NULL;

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

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feeling_tag TEXT,
  free_text TEXT,
  sentiment_score REAL CHECK (sentiment_score BETWEEN -1.0 AND 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mood_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  share_with_partner BOOLEAN DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  model_used TEXT DEFAULT 'minimaxai/minimax-m2.7',
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'fallback')),
  error_message TEXT,
  prompt_hash TEXT,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);
CREATE INDEX IF NOT EXISTS idx_couples_status ON couples(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_couple_id ON daily_tasks(couple_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_couple_date ON daily_tasks(couple_id, generated_date);
CREATE INDEX IF NOT EXISTS idx_feedback_couple_id ON feedback(couple_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON ai_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON ai_logs(status);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view partner profile" ON profiles FOR SELECT USING (couple_id IS NOT NULL AND couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can view profiles by invite code lookup" ON profiles FOR SELECT USING (
  couple_id IN (SELECT id FROM couples WHERE status = 'pending' AND partner_a_id != auth.uid())
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own couple" ON couples FOR SELECT USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid());
CREATE POLICY "Users can create couples" ON couples FOR INSERT WITH CHECK (partner_a_id = auth.uid());
CREATE POLICY "Users can update own couple" ON couples FOR UPDATE USING (partner_a_id = auth.uid() OR partner_b_id = auth.uid());

CREATE POLICY "Users can view own onboarding" ON onboarding_responses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own onboarding" ON onboarding_responses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own onboarding" ON onboarding_responses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view couple tasks" ON daily_tasks FOR SELECT USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update couple tasks" ON daily_tasks FOR UPDATE USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own feedback" ON feedback FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own mood" ON mood_checkins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Partner can view shared mood" ON mood_checkins FOR SELECT USING (share_with_partner = TRUE AND couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()) AND user_id != auth.uid());
CREATE POLICY "Users can insert own mood" ON mood_checkins FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS couple_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_couple_dates_couple_id ON couple_dates(couple_id);

ALTER TABLE couple_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view couple dates" ON couple_dates FOR SELECT USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert couple dates" ON couple_dates FOR INSERT WITH CHECK (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Users can delete couple dates" ON couple_dates FOR DELETE USING (couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid()));

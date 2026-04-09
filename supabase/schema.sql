-- Masters Pool 2026 - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES (extends Supabase Auth users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT,
  is_commissioner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- POOL SETTINGS
-- ============================================
CREATE TABLE pool_settings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Masters 2026 Pool',
  total_tiers INT NOT NULL DEFAULT 6,
  picks_per_tier INT NOT NULL DEFAULT 1,
  drop_count INT NOT NULL DEFAULT 2,
  missed_cut_penalty INT NOT NULL DEFAULT 8, -- +8 strokes per missed round
  tiebreaker_enabled BOOLEAN DEFAULT true,
  entry_deadline TIMESTAMPTZ DEFAULT '2026-04-10T12:00:00Z',
  is_locked BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  commissioner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOLFERS (with tier assignments + live scores)
-- ============================================
CREATE TABLE golfers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  espn_id TEXT,
  tier INT NOT NULL CHECK (tier BETWEEN 1 AND 6),
  -- Live score data (cached from ESPN API)
  round1 INT, -- score relative to par for round
  round2 INT,
  round3 INT,
  round4 INT,
  total_score INT, -- total strokes to par
  thru TEXT, -- e.g. "F", "12", "B9"
  position TEXT, -- e.g. "T1", "2", "CUT"
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cut', 'wd', 'dq')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_golfers_tier ON golfers(tier);
CREATE INDEX idx_golfers_espn_id ON golfers(espn_id);

-- ============================================
-- PICKS (one golfer per tier per user)
-- ============================================
CREATE TABLE picks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pool_id INT REFERENCES pool_settings(id) DEFAULT 1,
  tier INT NOT NULL,
  golfer_id INT REFERENCES golfers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pool_id, tier)
);

CREATE INDEX idx_picks_user ON picks(user_id);

-- ============================================
-- TIEBREAKERS
-- ============================================
CREATE TABLE tiebreakers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pool_id INT REFERENCES pool_settings(id) DEFAULT 1,
  predicted_winning_score INT NOT NULL, -- total strokes (e.g. 275)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pool_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pool settings: readable by all, editable by commissioner
ALTER TABLE pool_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pool settings are viewable by everyone"
  ON pool_settings FOR SELECT USING (true);

CREATE POLICY "Commissioner can update pool"
  ON pool_settings FOR UPDATE USING (auth.uid() = commissioner_id);

CREATE POLICY "Any authenticated user can create pool"
  ON pool_settings FOR INSERT WITH CHECK (auth.uid() = commissioner_id);

-- Golfers: readable by all, updatable by service role (API route)
ALTER TABLE golfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Golfers are viewable by everyone"
  ON golfers FOR SELECT USING (true);

CREATE POLICY "Service role can manage golfers"
  ON golfers FOR ALL USING (true);

-- Picks: users can read all, insert/update own before deadline
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Picks are viewable by everyone"
  ON picks FOR SELECT USING (true);

CREATE POLICY "Users can insert own picks"
  ON picks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own picks"
  ON picks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own picks"
  ON picks FOR DELETE USING (auth.uid() = user_id);

-- Tiebreakers: same as picks
ALTER TABLE tiebreakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tiebreakers are viewable by everyone"
  ON tiebreakers FOR SELECT USING (true);

CREATE POLICY "Users can insert own tiebreaker"
  ON tiebreakers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tiebreaker"
  ON tiebreakers FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- DEFAULT POOL (auto-create on schema run)
-- ============================================
-- Note: commissioner_id will be set when first user signs up
INSERT INTO pool_settings (name, entry_deadline)
VALUES ('Masters 2026 Pool', '2026-04-10T12:00:00Z');

-- ==========================================================
-- 1. CREATION DES TABLES
-- ==========================================================

CREATE TABLE IF NOT EXISTS achievements_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    condition_type TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements_definitions(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- 2. ACTIVATION DU RLS
-- ==========================================================

ALTER TABLE achievements_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 3. POLICIES (Sécurité)
-- ==========================================================

-- achievements_definitions : Lecture publique, Modification Admin via table profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON achievements_definitions;
DROP POLICY IF EXISTS "Enable admin write access" ON achievements_definitions;

CREATE POLICY "Enable read access for all users" ON achievements_definitions
  FOR SELECT USING (true);

CREATE POLICY "Enable admin write access" ON achievements_definitions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- user_achievements : Accès propre à chaque utilisateur
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- xp_history : Accès propre à chaque utilisateur
DROP POLICY IF EXISTS "Users can view their own xp history" ON xp_history;
DROP POLICY IF EXISTS "Users can insert their own xp history" ON xp_history;

CREATE POLICY "Users can view their own xp history" ON xp_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp history" ON xp_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
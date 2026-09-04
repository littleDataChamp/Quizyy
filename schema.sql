-- Create Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  host_id UUID
);

-- Create Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INT NOT NULL,
  time_limit INT DEFAULT 20,
  points_multiplier INT DEFAULT 1,
  sort_order INT DEFAULT 0
);

-- Create Game Sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(6) UNIQUE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'lobby',
  current_question_index INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  host_id UUID
);

-- Create Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  score INT DEFAULT 0,
  avatar_seed TEXT,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Create Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_index INT NOT NULL,
  time_taken NUMERIC NOT NULL,
  score_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, question_id)
);

-- RPC to increment score safely
CREATE OR REPLACE FUNCTION increment_score(row_id UUID, amount INT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE participants SET score = score + amount WHERE id = row_id;
END;
$$;

-- Enable Realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE game_sessions, participants, answers;

-- Row Level Security (RLS) - Basic Open Policies for now
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all (for development simplicity)
DROP POLICY IF EXISTS "Enable read access for all users" ON quizzes;
CREATE POLICY "Enable read access for all users" ON quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON quizzes;
CREATE POLICY "Enable insert for all users" ON quizzes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON quizzes;
CREATE POLICY "Enable update for all users" ON quizzes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON questions;
CREATE POLICY "Enable insert for all users" ON questions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON questions;
CREATE POLICY "Enable update for all users" ON questions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON game_sessions;
CREATE POLICY "Enable read access for all users" ON game_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON game_sessions;
CREATE POLICY "Enable insert for all users" ON game_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON game_sessions;
CREATE POLICY "Enable update for all users" ON game_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON participants;
CREATE POLICY "Enable read access for all users" ON participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON participants;
CREATE POLICY "Enable insert for all users" ON participants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON participants;
CREATE POLICY "Enable update for all users" ON participants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON answers;
CREATE POLICY "Enable read access for all users" ON answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON answers;
CREATE POLICY "Enable insert for all users" ON answers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON answers;
CREATE POLICY "Enable update for all users" ON answers FOR UPDATE USING (true);


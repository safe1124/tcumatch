-- 필수 테이블 생성 SQL (Supabase 대시보드 > SQL Editor에서 실행)

-- 1. 매칭 상호작용 테이블
CREATE TABLE IF NOT EXISTS user_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- 2. 매칭 결과 테이블
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 3. RLS 활성화
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 4. 정책 생성 (모든 사용자 접근 허용 - 개발용)
CREATE POLICY IF NOT EXISTS "Enable all access" ON user_interactions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access" ON matches FOR ALL USING (true);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);

SELECT 'All tables created successfully!' as result;

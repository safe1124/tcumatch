-- 매칭 앱 필수 테이블 생성 SQL
-- Supabase 대시보드의 SQL Editor에서 실행하세요
-- URL: https://supabase.com/dashboard/project/wamndgvguaybvgoudpxm/sql

-- 1. interactions 테이블 (좋아요/패스 기록)
CREATE TABLE IF NOT EXISTS public.interactions (
    id BIGSERIAL PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'pass')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- 2. matches 테이블 (매칭 성공 기록)
CREATE TABLE IF NOT EXISTS public.matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_interactions_from_user ON public.interactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_to_user ON public.interactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(type);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 (보안 규칙) - 개발 중에는 모든 접근 허용
DROP POLICY IF EXISTS "Enable read access for all users" ON public.interactions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.interactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.matches;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.matches;

-- 개발 모드: 모든 사용자에게 읽기/쓰기 권한 부여
CREATE POLICY "Enable read access for all users" ON public.interactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.matches FOR INSERT WITH CHECK (true);

-- 6. 테스트 데이터 삽입
INSERT INTO public.profiles (user_id, nickname, gender, birthdate, bio, created_at) VALUES
('test_user_alice', 'Alice', 'female', '1998-03-15', '안녕하세요! 컴퓨터과학을 공부하고 있는 Alice입니다.', NOW()),
('test_user_bob', 'Bob', 'male', '1997-07-22', '안녕하세요! 경영학과 Bob입니다. 음악과 영화를 좋아해요.', NOW()),
('test_user_charlie', 'Charlie', 'male', '1999-11-08', '디자인을 공부하는 Charlie입니다. 카페와 산책을 좋아합니다.', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 완료 메시지
SELECT 'Tables and test data created successfully!' as result;

-- 간단한 Supabase 프로필 테이블 생성 SQL
-- 복사해서 https://app.supabase.com > SQL Editor에서 실행하세요

-- 1. 기본 테이블 생성
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  nickname TEXT,
  gender TEXT,
  birthdate DATE,
  bio TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 모든 사용자가 접근할 수 있도록 RLS 설정 (간단한 버전)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 모든 접근 허용 정책 (개발 단계용)
CREATE POLICY "Enable all access for all users" ON profiles 
FOR ALL USING (true);

-- 완료 메시지
SELECT 'profiles 테이블 생성 완료!' as message;

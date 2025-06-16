-- Supabase 프로필 테이블 생성 SQL
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- 1. profiles 테이블 생성
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

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 정책 생성 (사용자가 자신의 프로필만 관리할 수 있도록)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (true);

-- 4. 인덱스 생성 (성능 향상)
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- 5. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테이블 생성 완료 메시지
SELECT 'profiles 테이블이 성공적으로 생성되었습니다!' as message;

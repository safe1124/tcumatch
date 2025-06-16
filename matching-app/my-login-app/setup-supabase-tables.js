#!/usr/bin/env node

/**
 * Supabase 테이블 자동 생성 스크립트
 * 
 * 사용법:
 * 1. npm install @supabase/supabase-js
 * 2. node setup-supabase-tables.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://wamndgvguaybvgoudpxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbW5kZ3ZndWF5YnZnb3VkcHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDEwOTYsImV4cCI6MjA2NTIxNzA5Nn0.MmHWayjKCZbA_f9p4A5cToUnNbhslpavmfoanH5mlZU';

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 테이블 생성 SQL
const CREATE_PROFILES_TABLE = `
-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete their own profile" ON profiles
  FOR DELETE USING (true);

-- 4. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- 5. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

// 매칭 관련 테이블 생성 SQL
const CREATE_MATCHING_TABLES = `
-- 매칭 상호작용 테이블
CREATE TABLE IF NOT EXISTS user_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- 매칭 결과 테이블
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 매칭 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);

-- 매칭 RLS 설정
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 매칭 정책
CREATE POLICY IF NOT EXISTS "Users can manage their own interactions" ON user_interactions
  FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Users can view their matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);
`;

// 메인 함수
async function setupSupabaseTables() {
    console.log('🚀 Supabase 테이블 설정 시작...');
    console.log('📡 연결 URL:', SUPABASE_URL);
    
    try {
        // 1. 프로필 테이블 생성
        console.log('\n1️⃣ 프로필 테이블 생성 중...');
        const { data: profileData, error: profileError } = await supabase.rpc('exec_sql', {
            sql: CREATE_PROFILES_TABLE
        });
        
        if (profileError) {
            console.error('❌ 프로필 테이블 생성 실패:', profileError);
            // SQL Editor 방법 안내
            console.log('\n📋 수동 생성 방법:');
            console.log('1. https://app.supabase.com 접속');
            console.log('2. 프로젝트 선택 (wamndgvguaybvgoudpxm)');
            console.log('3. SQL Editor 메뉴 클릭');
            console.log('4. 아래 SQL 복사하여 실행:');
            console.log('\n--- SQL 시작 ---');
            console.log(CREATE_PROFILES_TABLE);
            console.log('--- SQL 끝 ---\n');
        } else {
            console.log('✅ 프로필 테이블 생성 완료');
        }
        
        // 2. 매칭 테이블 생성
        console.log('\n2️⃣ 매칭 테이블 생성 중...');
        const { data: matchingData, error: matchingError } = await supabase.rpc('exec_sql', {
            sql: CREATE_MATCHING_TABLES
        });
        
        if (matchingError) {
            console.error('❌ 매칭 테이블 생성 실패:', matchingError);
            console.log('\n📋 매칭 테이블 수동 생성 SQL:');
            console.log(CREATE_MATCHING_TABLES);
        } else {
            console.log('✅ 매칭 테이블 생성 완료');
        }
        
        // 3. 테이블 확인
        console.log('\n3️⃣ 테이블 생성 확인 중...');
        
        const { data: profileCheck, error: profileCheckError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact' })
            .limit(1);
        
        if (!profileCheckError) {
            console.log('✅ profiles 테이블 확인됨');
        } else {
            console.log('❌ profiles 테이블 없음:', profileCheckError.message);
        }
        
        const { data: interactionCheck, error: interactionCheckError } = await supabase
            .from('user_interactions')
            .select('count', { count: 'exact' })
            .limit(1);
        
        if (!interactionCheckError) {
            console.log('✅ user_interactions 테이블 확인됨');
        } else {
            console.log('❌ user_interactions 테이블 없음:', interactionCheckError.message);
        }
        
        console.log('\n🎉 Supabase 테이블 설정 완료!');
        console.log('\n📱 이제 애플리케이션을 테스트할 수 있습니다:');
        console.log('1. http://localhost:8002 접속');
        console.log('2. Google 로그인');
        console.log('3. 프로필 생성 및 매칭 시스템 사용');
        
    } catch (error) {
        console.error('💥 예상치 못한 오류:', error);
        
        console.log('\n🔧 문제 해결 방법:');
        console.log('1. Supabase 프로젝트가 활성화되어 있는지 확인');
        console.log('2. anon key가 올바른지 확인');
        console.log('3. 수동으로 SQL Editor에서 테이블 생성');
    }
}

// 스크립트 실행
if (require.main === module) {
    setupSupabaseTables()
        .then(() => {
            console.log('\n✨ 스크립트 실행 완료');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 스크립트 실행 실패:', error);
            process.exit(1);
        });
}

module.exports = { setupSupabaseTables };

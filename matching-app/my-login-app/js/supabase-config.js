// Supabase 설정 파일
console.log("supabase-config.js 로드됨");

// Supabase 설정 (실제 프로젝트 설정)
const SUPABASE_URL = 'https://wamndgvguaybvgoudpxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbW5kZ3ZndWF5YnZnb3VkcHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDEwOTYsImV4cCI6MjA2NTIxNzA5Nn0.MmHWayjKCZbA_f9p4A5cToUnNbhslpavmfoanH5mlZU';

// Supabase 클라이언트 전역 변수
window.supabaseClient = null;

// Supabase 초기화 함수
function initializeSupabase() {
    console.log("Supabase 초기화 시작...");
    console.log("Supabase URL:", SUPABASE_URL);
    
    try {
        // Supabase 라이브러리 확인
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase 라이브러리가 로드되지 않았습니다.');
            console.log('Supabase 스크립트가 올바르게 로드되었는지 확인하세요.');
            return false;
        }
        
        // 실제 Supabase 클라이언트 생성
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        console.log("✅ Supabase 클라이언트 초기화 완료");
        console.log("클라이언트 객체:", window.supabaseClient);
        
        // 연결 테스트
        testSupabaseConnection();
        
        return true;
        
    } catch (error) {
        console.error("❌ Supabase 초기화 실패:", error);
        return false;
    }
}

// Supabase 연결 테스트
async function testSupabaseConnection() {
    if (!window.supabaseClient) {
        console.warn("Supabase 클라이언트가 초기화되지 않았습니다.");
        return false;
    }
    
    try {
        console.log("Supabase 연결 테스트 시작...");
        
        // 간단한 쿼리로 연결 테스트 (존재하지 않는 테이블도 괜찮음 - 연결만 확인)
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('count', { count: 'exact' })
            .limit(1);
        
        if (error && error.code !== '42P01') { // 42P01 = relation does not exist (테이블 없음)
            throw error;
        }
        
        console.log("✅ Supabase 연결 테스트 성공");
        return true;
        
    } catch (error) {
        console.warn("⚠️ Supabase 연결 테스트 중 오류:", error);
        console.log("이는 정상적일 수 있습니다 (테이블이 아직 생성되지 않은 경우)");
        return false;
    }
}

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 약간의 지연을 두어 다른 스크립트들이 로드될 시간을 줍니다
    setTimeout(() => {
        initializeSupabase();
    }, 100);
});

// 프로필 테이블 자동 생성 함수
async function createProfilesTableAutomatically() {
    console.log("프로필 테이블 자동 생성 시도...");
    
    if (!supabaseClient) {
        console.error("Supabase 클라이언트가 초기화되지 않았습니다.");
        return false;
    }
    
    try {
        // 1. 테이블 생성 SQL
        const createTableSQL = `
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
        `;
        
        // 2. RLS 및 정책 설정 SQL
        const securitySQL = `
            -- 2. RLS 활성화
            ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
            
            -- 3. 정책 생성
            CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON profiles
              FOR SELECT USING (true);
            
            CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON profiles
              FOR INSERT WITH CHECK (true);
            
            CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
              FOR UPDATE USING (true);
            
            CREATE POLICY IF NOT EXISTS "Users can delete their own profile" ON profiles
              FOR DELETE USING (true);
        `;
        
        // 3. 인덱스 및 트리거 SQL
        const optimizationSQL = `
            -- 4. 인덱스 생성
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
        
        console.log("1단계: 테이블 생성 중...");
        const { data: tableData, error: tableError } = await supabaseClient.rpc('exec_sql', {
            sql: createTableSQL
        });
        
        if (tableError) {
            console.warn("테이블 생성 중 오류 (이미 존재할 수 있음):", tableError);
        } else {
            console.log("✅ 테이블 생성 완료");
        }
        
        console.log("2단계: 보안 정책 설정 중...");
        const { data: securityData, error: securityError } = await supabaseClient.rpc('exec_sql', {
            sql: securitySQL
        });
        
        if (securityError) {
            console.warn("보안 설정 중 오류:", securityError);
        } else {
            console.log("✅ 보안 정책 설정 완료");
        }
        
        console.log("3단계: 최적화 설정 중...");
        const { data: optimizationData, error: optimizationError } = await supabaseClient.rpc('exec_sql', {
            sql: optimizationSQL
        });
        
        if (optimizationError) {
            console.warn("최적화 설정 중 오류:", optimizationError);
        } else {
            console.log("✅ 최적화 설정 완료");
        }
        
        console.log("🎉 프로필 테이블 자동 생성 완료!");
        return true;
        
    } catch (error) {
        console.error("❌ 테이블 자동 생성 실패:", error);
        console.log("📋 수동으로 Supabase 대시보드에서 테이블을 생성해주세요.");
        return false;
    }
}

// 테이블 존재 여부 확인 및 자동 생성
async function ensureProfilesTableExists() {
    try {
        // 테이블 존재 여부 확인
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('count', { count: 'exact' })
            .limit(1);
        
        if (error && error.code === '42P01') {
            // 테이블이 존재하지 않음 - 자동 생성 시도
            console.log("프로필 테이블이 존재하지 않습니다. 자동 생성을 시도합니다...");
            return await createProfilesTableAutomatically();
        } else if (error) {
            console.error("테이블 확인 중 오류:", error);
            return false;
        } else {
            console.log("✅ 프로필 테이블이 이미 존재합니다.");
            return true;
        }
        
    } catch (error) {
        console.error("테이블 존재 여부 확인 실패:", error);
        return false;
    }
}

console.log("Supabase 설정 파일 로드 완료");

// Node.js를 사용한 Supabase 테이블 자동 생성 스크립트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 환경 변수에서 Supabase 설정 읽기
const supabaseUrl = 'https://wamndgvguaybvgoudpxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbW5kZ3ZndWF5YnZnb3VkcHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1Nzg0ODYsImV4cCI6MjA1MDE1NDQ4Nn0.jXKJ0H5Xgm7-xEVR5y1B7_kf53Qv8J0vGNO1xQgBc5I';

console.log('🚀 Supabase 테이블 설정 시작...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesIfNotExists() {
    console.log('\n=== 테이블 생성 시작 ===');
    
    // 1. profiles 테이블 확인
    console.log('1️⃣ profiles 테이블 확인 중...');
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
        
        if (error && error.code === '42P01') {
            console.log('❌ profiles 테이블이 존재하지 않음');
        } else if (error) {
            console.log('⚠️ profiles 테이블 확인 중 오류:', error.message);
        } else {
            console.log('✅ profiles 테이블 존재함');
        }
    } catch (err) {
        console.error('❌ profiles 테이블 확인 실패:', err.message);
    }
    
    // 2. interactions 테이블 확인
    console.log('\n2️⃣ interactions 테이블 확인 중...');
    try {
        const { data, error } = await supabase
            .from('interactions')
            .select('*')
            .limit(1);
        
        if (error && error.code === '42P01') {
            console.log('❌ interactions 테이블이 존재하지 않음');
        } else if (error) {
            console.log('⚠️ interactions 테이블 확인 중 오류:', error.message);
        } else {
            console.log('✅ interactions 테이블 존재함');
        }
    } catch (err) {
        console.error('❌ interactions 테이블 확인 실패:', err.message);
    }
    
    // 3. matches 테이블 확인
    console.log('\n3️⃣ matches 테이블 확인 중...');
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .limit(1);
        
        if (error && error.code === '42P01') {
            console.log('❌ matches 테이블이 존재하지 않음');
        } else if (error) {
            console.log('⚠️ matches 테이블 확인 중 오류:', error.message);
        } else {
            console.log('✅ matches 테이블 존재함');
        }
    } catch (err) {
        console.error('❌ matches 테이블 확인 실패:', err.message);
    }
    
    console.log('\n=== 테이블 확인 완료 ===');
    console.log('\n📋 누락된 테이블이 있다면 Supabase 대시보드에서 SQL을 실행하세요:');
    console.log('파일: create-interactions-matches-tables.sql');
}

// 테스트 데이터 생성 함수
async function createTestData() {
    console.log('\n=== 테스트 데이터 생성 시작 ===');
    
    // 테스트 프로필 생성
    const testProfiles = [
        {
            user_id: 'test_user_alice',
            nickname: 'Alice',
            gender: 'female',
            birthdate: '1998-03-15',
            bio: '안녕하세요! 컴퓨터과학을 공부하고 있는 Alice입니다.',
            photo_url: null,
            created_at: new Date().toISOString()
        },
        {
            user_id: 'test_user_bob',
            nickname: 'Bob',
            gender: 'male',
            birthdate: '1997-07-22',
            bio: '안녕하세요! 경영학과 Bob입니다. 음악과 영화를 좋아해요.',
            photo_url: null,
            created_at: new Date().toISOString()
        },
        {
            user_id: 'test_user_charlie',
            nickname: 'Charlie',
            gender: 'male',
            birthdate: '1999-11-08',
            bio: '디자인을 공부하는 Charlie입니다. 카페와 산책을 좋아합니다.',
            photo_url: null,
            created_at: new Date().toISOString()
        }
    ];
    
    // 프로필 삽입 시도
    for (const profile of testProfiles) {
        try {
            console.log(`👤 ${profile.nickname} 프로필 생성 중...`);
            
            // 기존 프로필 확인
            const { data: existing } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', profile.user_id)
                .single();
            
            if (existing) {
                console.log(`✅ ${profile.nickname} 프로필이 이미 존재함`);
                continue;
            }
            
            // 새 프로필 생성
            const { data, error } = await supabase
                .from('profiles')
                .insert([profile]);
            
            if (error) {
                console.log(`❌ ${profile.nickname} 프로필 생성 실패:`, error.message);
            } else {
                console.log(`✅ ${profile.nickname} 프로필 생성 완료`);
            }
        } catch (err) {
            console.error(`❌ ${profile.nickname} 프로필 생성 중 예외:`, err.message);
        }
    }
    
    console.log('\n=== 테스트 데이터 생성 완료 ===');
}

// 메인 실행 함수
async function main() {
    try {
        await createTablesIfNotExists();
        await createTestData();
        
        console.log('\n🎉 설정 완료!');
        console.log('이제 매칭 페이지에서 버튼을 테스트해보세요.');
    } catch (error) {
        console.error('❌ 설정 중 오류 발생:', error);
    }
}

// 스크립트 실행
main();

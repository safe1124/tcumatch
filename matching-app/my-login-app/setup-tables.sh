#!/bin/bash

# Supabase 테이블 설정 스크립트
# 사용법: ./setup-tables.sh

echo "🚀 Supabase 테이블 자동 설정 시작..."

# Node.js가 설치되어 있는지 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "📥 Node.js를 설치해주세요: https://nodejs.org/"
    exit 1
fi

# npm이 설치되어 있는지 확인
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되어 있지 않습니다."
    exit 1
fi

echo "✅ Node.js 환경 확인 완료"

# Supabase 라이브러리 설치
echo "📦 Supabase 라이브러리 설치 중..."
npm install @supabase/supabase-js

if [ $? -eq 0 ]; then
    echo "✅ Supabase 라이브러리 설치 완료"
else
    echo "❌ Supabase 라이브러리 설치 실패"
    exit 1
fi

# 테이블 설정 스크립트 실행
echo "🛠️ 테이블 생성 스크립트 실행 중..."
node setup-supabase-tables.js

echo "🎉 설정 완료!"
echo ""
echo "📱 이제 다음 단계를 진행하세요:"
echo "1. 웹 브라우저에서 http://localhost:8002 접속"
echo "2. Google 로그인 진행"
echo "3. 프로필 생성 및 매칭 시스템 테스트"

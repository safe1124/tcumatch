# 💕 캠퍼스 매칭 앱 (Campus Matching App)

> 대학생들을 위한 Tinder/Pairs 스타일의 모바일 친화적 매칭 웹 애플리케이션

## ✨ 주요 기능

- 🔐 **Google 소셜 로그인** (Firebase Authentication)
- 👤 **프로필 관리** - 닉네임, 성별, 생년월일, 자기소개, 프로필 사진
- 💝 **스와이프 매칭** - Pairs 스타일의 좋아요/패스 시스템
- 🎯 **실시간 매칭** - 상호 좋아요 시 즉시 매칭 알림
- 📱 **모바일 최적화** - 반응형 디자인으로 모든 기기 지원
- 💬 **채팅 시스템** (준비 중)

## 🛠️ 기술 스택

### Frontend
- **HTML5** - 시맨틱 마크업
- **CSS3** - 반응형 디자인, Flexbox, Grid
- **JavaScript (ES6+)** - 모던 브라우저 지원

### Backend & Database
- **Firebase Authentication** - Google 소셜 로그인
- **Supabase** - PostgreSQL 기반 실시간 데이터베이스
- **Firebase Storage** - 프로필 이미지 저장

### 개발 도구
- **Python HTTP Server** - 로컬 개발 환경
- **Node.js** - 패키지 관리 및 빌드 도구

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/[username]/campus-matching-app.git
cd campus-matching-app
```

### 2. 의존성 설치
```bash
cd matching-app/my-login-app
npm install
```

### 3. 환경 설정
```bash
# .env 파일 생성 (my-login-app 디렉토리에)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행
```bash
# Python 개발 서버 시작
python3 -m http.server 8000

# 브라우저에서 접속
# http://localhost:8000/matching-app/my-login-app/
```

## 📊 데이터베이스 설정

### Supabase 테이블 생성
```sql
-- profiles 테이블 (사용자 프로필)
CREATE TABLE profiles (
    user_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    gender TEXT NOT NULL,
    birthdate DATE NOT NULL,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- interactions 테이블 (좋아요/패스)
CREATE TABLE interactions (
    id BIGSERIAL PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'pass')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- matches 테이블 (매칭 성공)
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);
```

## 🎮 사용 방법

### 1. 회원가입/로그인
- Google 계정으로 간편 로그인
- 첫 로그인 시 프로필 설정 페이지로 자동 이동

### 2. 프로필 설정
- 닉네임, 성별, 생년월일 입력 (필수)
- 자기소개 작성 (선택)
- 프로필 사진 업로드 (선택)

### 3. 매칭 시작
- 다른 사용자 프로필 카드 확인
- ❤️ 좋아요 또는 ❌ 패스 선택
- 상호 좋아요 시 매칭 성공 알림

## 🔧 개발 도구

### 테스트 페이지들
- **`matching-button-test.html`** - 버튼 기능 테스트
- **`supabase-setup-tool.html`** - 데이터베이스 설정 도구
- **`profile-form-test.html`** - 프로필 폼 테스트

### 디버깅 기능
- 실시간 디버깅 패널 (매칭 페이지 우상단)
- 콘솔 로그를 통한 상태 추적
- 네트워크 요청 모니터링

## 📱 지원 브라우저

- ✅ Chrome (권장)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- 📱 모든 모바일 브라우저

## 🐛 알려진 이슈

- [ ] Safari에서 일부 CSS 애니메이션 성능 이슈
- [ ] 오프라인 모드 미지원
- [ ] PWA 기능 미구현

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

- 이메일: [your-email@example.com]
- 프로젝트 링크: [https://github.com/[username]/campus-matching-app]

## 🎯 로드맵

### v1.0 (현재)
- ✅ 기본 매칭 시스템
- ✅ 프로필 관리
- ✅ Google 로그인

### v1.1 (계획)
- [ ] 실시간 채팅 시스템
- [ ] 푸시 알림
- [ ] 프로필 사진 필터

### v2.0 (장기)
- [ ] 위치 기반 매칭
- [ ] 관심사 태그 시스템
- [ ] AI 기반 매칭 추천

---

**Made with ❤️ for university students**

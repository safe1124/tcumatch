# 🚀 Vercel 배포 가이드 - TCU Match

## ✅ 해결된 404 에러 문제점들

### 🔧 수정사항:
1. **프로젝트 구조 간소화**: 앱 파일들을 루트 디렉토리로 이동
2. **vercel.json 설정 추가**: 올바른 라우팅 설정
3. **정적 파일 경로 최적화**: CSS, JS 파일 경로 수정

---

## 🌐 Vercel 재배포 단계

### 1. Vercel 대시보드 접속
- https://vercel.com/dashboard 접속
- tcumatch 프로젝트 선택

### 2. 재배포 실행
```bash
# 방법 1: Vercel 대시보드에서
- "Deployments" 탭 클릭
- "Redeploy" 버튼 클릭

# 방법 2: Git push로 자동 배포 (이미 완료됨)
- GitHub에 변경사항이 푸시되어 자동 배포될 예정
```

### 3. 환경 변수 설정 (중요!)
Vercel 대시보드 > Settings > Environment Variables에서 추가:

```env
# Supabase 설정
SUPABASE_URL=https://wamndgvguaybvgoudpxm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase 설정 (필요시)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
```

---

## 📁 새로운 프로젝트 구조

```
/
├── index.html              ← 메인 페이지 (루트에서 바로 접근)
├── matching.html           ← 매칭 페이지
├── profile.html            ← 프로필 페이지
├── css/
│   └── style.css          ← 스타일 파일
├── js/
│   ├── firebase-config.js ← Firebase 설정
│   ├── supabase-config.js ← Supabase 설정
│   ├── matching.js        ← 매칭 로직
│   └── profile.js         ← 프로필 로직
├── vercel.json            ← Vercel 배포 설정
└── ...기타 파일들
```

---

## 🔍 배포 후 확인사항

### 1. 기본 접속 테스트
- **메인 페이지**: https://your-app.vercel.app/
- **매칭 페이지**: https://your-app.vercel.app/matching.html
- **프로필 페이지**: https://your-app.vercel.app/profile.html

### 2. 개발자 도구 확인
- F12 → Console 탭에서 에러 메시지 확인
- Network 탭에서 파일 로딩 상태 확인

### 3. 기능 테스트
- Google 로그인 기능
- 프로필 생성/수정
- 매칭 버튼 (❤️, ❌) 클릭

---

## 🚨 자주 발생하는 문제 해결

### 404 에러가 계속 발생하는 경우:
1. **Vercel 대시보드 확인**:
   - Functions 탭에서 빌드 로그 확인
   - 에러 메시지가 있는지 체크

2. **캐시 문제**:
   ```bash
   # 브라우저 캐시 완전 삭제
   Ctrl+Shift+R (Windows) 또는 Cmd+Shift+R (Mac)
   ```

3. **경로 문제**:
   - 모든 상대 경로가 올바른지 확인
   - `./` 또는 `/`로 시작하는 경로 사용

### Firebase/Supabase 연결 에러:
1. **환경 변수 설정 확인**
2. **도메인 허용 목록 추가**:
   - Firebase: Authentication > Settings > Authorized domains
   - Supabase: Settings > API > Site URL

---

## 🎯 성공적인 배포 확인

✅ **배포 성공 시 기대되는 결과:**
- 메인 페이지가 정상적으로 로드됨
- Google 로그인 버튼 작동
- 매칭 페이지에서 프로필 카드 표시
- 좋아요/패스 버튼 정상 작동

🔗 **배포 완료 후 URL**: https://tcumatch.vercel.app

---

**💡 팁**: 배포가 완료되면 실제 URL을 통해 모든 기능을 다시 테스트해보세요!

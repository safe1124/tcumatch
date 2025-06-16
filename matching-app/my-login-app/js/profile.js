/* filepath: /Users/shin/Desktop/match/matching-app/my-login-app/js/profile.js */
console.log("profile.js 시작됨");

// Firebase 서비스 변수 (인증용)
let auth, storage;
let currentUser = null;

// Supabase 변수는 supabase-config.js에서 전역으로 선언되므로 여기서는 제거
// let window.supabaseClient = null; // 제거됨 - supabase-config.js에서 관리

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM 로드 완료 - profile.js");

    // Firebase 초기화 확인 (인증용)
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK가 로드되지 않았습니다.');
        alert('Firebase 초기화 오류가 발생했습니다.');
        return;
    }

    try {
        // Firebase 서비스 초기화 (인증과 스토리지만)
        auth = firebase.auth();
        storage = firebase.storage();
        
        // Supabase 초기화 (프로필 데이터용)
        const supabaseInitialized = initializeSupabase();
        if (supabaseInitialized) {
            console.log("✅ Supabase 초기화 완료");
            updateDebugStatus('supabase', '✅ 초기화됨');
        } else {
            console.warn("⚠️ Supabase 초기화 실패 - 테스트 모드로 진행");
            updateDebugStatus('supabase', '⚠️ 테스트 모드');
        }
        
        
        console.log("Firebase 서비스 초기화 완료");
        
        // 디버깅 상태 초기화
        updateDebugStatus('firebase', '✅ 초기화됨');
        updateLastAction('Firebase 및 Supabase 서비스 초기화 완료');
        
        // 폼 요소 가져오기
        setupFormElements();
        
        // 인증 상태 리스너 설정
        setupAuthListener();
        
        // 네트워크 상태 모니터링 시작
        setupNetworkMonitoring();
        
    } catch (error) {
        console.error("서비스 초기화 오류:", error);
        alert('서비스 초기화 중 오류가 발생했습니다.');
    }
});

function setupFormElements() {
    const profileForm = document.getElementById('profile-form');
    const saveButton = document.getElementById('save-profile-btn');
    
    if (!profileForm || !saveButton) {
        console.error("프로필 폼 또는 저장 버튼을 찾을 수 없습니다.");
        return;
    }
    
    console.log("폼과 버튼 요소 확인됨");
    
    // 폼 제출 방지 (확실한 방법)
    profileForm.onsubmit = function(event) {
        console.log("폼 onsubmit 호출됨 - 기본 동작 방지");
        event.preventDefault();
        event.stopPropagation();
        return false;
    };
    
    // 추가 안전장치: addEventListener도 사용
    profileForm.addEventListener('submit', function(event) {
        console.log("폼 addEventListener submit 호출됨 - 기본 동작 방지");
        event.preventDefault();
        event.stopPropagation();
        return false;
    });
    
    // 버튼 클릭 이벤트 (메인 처리)
    saveButton.onclick = function(event) {
        console.log("저장 버튼 onclick 호출됨");
        event.preventDefault();
        event.stopPropagation();
        handleProfileSubmit(event);
        return false;
    };
    
    // 추가 안전장치: addEventListener도 사용
    saveButton.addEventListener('click', function(event) {
        console.log("저장 버튼 addEventListener click 호출됨");
        event.preventDefault();
        event.stopPropagation();
        handleProfileSubmit(event);
        return false;
    });
    
    console.log("프로필 폼 이벤트 리스너 설정 완료 (강화된 버전)");
}

function setupAuthListener() {
    auth.onAuthStateChanged(async (user) => {
        console.log("프로필 페이지 - 인증 상태 변화:", user ? user.uid : "로그아웃");
        
        // 테스트용: 인증이 없어도 가짜 사용자로 진행
        if (!user) {
            console.log("❌ 사용자 인증되지 않음 - 테스트 모드로 진행");
            
            // 테스트용 가짜 사용자 생성
            currentUser = {
                uid: 'test_user_' + Date.now(),
                email: 'test@example.com',
                displayName: 'Test User'
            };
            
            console.log("🧪 테스트 사용자 생성됨:", currentUser);
            
            // 디버깅 상태 업데이트
            updateDebugStatus('auth', `🧪 테스트 모드 (${currentUser.email})`);
            updateLastAction('테스트 사용자로 진행');
            
            // 기존 프로필 확인 스킵 (테스트 모드)
            console.log("테스트 모드 - 기존 프로필 확인 스킵");
            
            return;
        }
        
        // 실제 사용자 로그인된 경우
        currentUser = user;
        console.log("사용자 인증됨:", user.uid);
        console.log("사용자 이메일:", user.email);
        
        // 디버깅 상태 업데이트
        updateDebugStatus('auth', `✅ 로그인됨 (${user.email})`);
        updateLastAction('사용자 로그인 확인됨');
        
        // Firebase 연결 테스트
        await testFirebaseConnection();
        
        // 기존 프로필 확인 - 이미 있으면 매칭 페이지로 이동 (Supabase 사용)
        const existingProfile = await checkExistingProfileSupabase(user.uid);
        if (existingProfile) {
            console.log("기존 프로필 발견 - 매칭 페이지로 이동");
            alert("이미 프로필이 존재합니다. 매칭 페이지로 이동합니다.");
            window.location.href = 'matching.html';
            return;
        }
        
        // 기존 프로필 정보 로드 시도 (폼 채우기) - Supabase 사용
        await loadExistingProfileSupabase(user.uid);
    });
}

// 디버깅 패널 관련 함수들
function toggleDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function updateDebugStatus(service, status) {
    const element = document.getElementById(`${service}-status`);
    if (element) {
        element.textContent = status;
        element.style.color = status.includes('✅') ? 'green' : status.includes('❌') ? 'red' : 'orange';
    }
}

function updateLastAction(action) {
    const element = document.getElementById('last-action');
    if (element) {
        const timestamp = new Date().toLocaleTimeString();
        element.textContent = `[${timestamp}] ${action}`;
    }
}

// Firebase 연결 테스트
async function testFirebaseConnection() {
    updateLastAction('Firebase 연결 테스트 시작');
    
    try {
        if (!auth || !storage) {
            throw new Error('Firebase 서비스가 초기화되지 않음');
        }
        
        updateDebugStatus('firebase', '✅ 연결됨');
        
        // 인증 상태 확인
        if (currentUser) {
            updateDebugStatus('auth', `✅ 로그인됨 (${currentUser.email})`);
            
            console.log("Firebase 인증 및 스토리지 서비스 정상 작동");
            
        } else {
            updateDebugStatus('auth', '❌ 로그인 필요');
        }
        
        updateLastAction('Firebase 연결 테스트 완료');
        return true;
        
    } catch (error) {
        console.error('Firebase 연결 테스트 오류:', error);
        
        updateDebugStatus('firebase', `❌ 오류: ${error.message}`);
        updateLastAction(`Firebase 연결 테스트 실패: ${error.message}`);
        
        return false;
    }
}

// Firestore 쓰기 테스트
async function testFirestoreWrite() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    updateLastAction('Firestore 쓰기 테스트 시작');
    
    try {
        const testData = {
            testField: 'Firebase 연결 테스트',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser.uid
        };
        
        const testDocId = 'test-' + Date.now();
        await db.collection('test').doc(testDocId).set(testData);
        
        updateLastAction('Firestore 쓰기 테스트 성공');
        alert('Firestore 쓰기 테스트 성공!');
        
        // 테스트 문서 삭제
        await db.collection('test').doc(testDocId).delete();
        updateLastAction('테스트 문서 정리 완료');
        
    } catch (error) {
        updateLastAction(`Firestore 쓰기 테스트 실패: ${error.message}`);
        alert(`Firestore 쓰기 오류: ${error.message}`);
        console.error('Firestore 쓰기 테스트 오류:', error);
    }
}

// 기존 프로필 정보 로드 (있다면) - Supabase 사용
async function loadExistingProfileSupabase(uid) {
    try {
        console.log("Supabase에서 기존 프로필 정보 확인 중...");
        
        if (!window.supabaseClient) {
            console.warn("Supabase 클라이언트가 없음 - 프로필 로드 건너뛰기");
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', uid)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }
        
        if (data) {
            console.log("기존 프로필 정보 발견:", data);
            // 폼에 기존 데이터 채우기
            fillFormWithExistingData(data);
        } else {
            console.log("기존 프로필 정보 없음 - 새로 작성");
        }
    } catch (error) {
        console.error("기존 프로필 로드 오류:", error);
    }
}

// 폼에 기존 데이터 채우기
function fillFormWithExistingData(userData) {
    try {
        const nicknameInput = document.getElementById('nickname');
        const genderInput = document.getElementById('gender');
        const birthdateInput = document.getElementById('birthdate');
        const bioInput = document.getElementById('bio');
        
        if (nicknameInput && userData.nickname) {
            nicknameInput.value = userData.nickname;
        }
        
        if (genderInput && userData.gender) {
            genderInput.value = userData.gender;
        }
        
        if (birthdateInput && userData.birthdate) {
            birthdateInput.value = userData.birthdate;
        }
        
        if (bioInput && userData.bio) {
            bioInput.value = userData.bio;
        }
        
        console.log("기존 프로필 데이터로 폼 채우기 완료");
        
    } catch (error) {
        console.error("폼 채우기 오류:", error);
    }
}

// 프로필 폼 제출 처리 (간소화된 버전)
async function handleProfileSubmit(event) {
    console.log("=== 프로필 폼 제출 시작 ===");
    console.log("이벤트 타입:", event ? event.type : 'undefined');
    console.log("이벤트 대상:", event ? event.target : 'undefined');
    
    // 확실한 기본 동작 방지
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    updateLastAction('프로필 저장 시작');
    
    // 로그인 확인
    if (!currentUser) {
        console.error("현재 사용자가 없습니다.");
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        window.location.href = 'index.html';
        return false;
    }
    
    console.log("현재 사용자 확인됨:", currentUser.uid);
    
    // 버튼 상태 변경
    const submitButton = document.getElementById('save-profile-btn');
    const originalButtonText = submitButton ? submitButton.textContent : '';
    
    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '저장 중...';
            submitButton.style.backgroundColor = '#ffc107';
            submitButton.style.color = '#000';
        }
        
        // 1. 폼 데이터 수집
        console.log("1. 폼 데이터 수집 중...");
        const formData = collectFormData();
        console.log("수집된 폼 데이터:", formData);
        
        // 2. 필수 필드 검증
        if (!formData.nickname || !formData.gender || !formData.birthdate) {
            const missingFields = [];
            if (!formData.nickname) missingFields.push("닉네임");
            if (!formData.gender) missingFields.push("성별");
            if (!formData.birthdate) missingFields.push("생년월일");
            
            alert(`다음 필드는 필수입니다: ${missingFields.join(", ")}`);
            return false;
        }
        
        console.log("✅ 필수 필드 검증 통과");
        
        // 3. Supabase 연결 확인
        if (!window.window.supabaseClient) {
            console.warn("Supabase 클라이언트가 없습니다. 초기화를 시도합니다...");
            const initialized = initializeSupabase();
            if (!initialized || !window.window.supabaseClient) {
                alert("Supabase 연결에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.");
                return false;
            }
        }
        
        console.log("✅ Supabase 클라이언트 확인됨");
        
        // 4. 프로필 데이터 준비
        const profileData = {
            user_id: currentUser.uid,
            email: currentUser.email,
            nickname: formData.nickname,
            gender: formData.gender,
            birthdate: formData.birthdate,
            bio: formData.bio || '',
            profile_picture_url: '', // 나중에 구현
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log("준비된 프로필 데이터:", profileData);
        
        console.log("5. Supabase에 저장 시작...");
        updateLastAction('Supabase에 프로필 저장 중...');
        
        // 5. 실제 저장
        const { data, error } = await window.window.supabaseClient
            .from('profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select();
        
        if (error) {
            console.error("Supabase 저장 오류:", error);
            
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                alert(`프로필 테이블이 존재하지 않습니다!

해결 방법:
1. 페이지 하단의 "🔧 디버깅 패널 토글" 클릭
2. "📋 Supabase 테이블 생성" 버튼 클릭

또는 수동으로 https://app.supabase.com에서 테이블을 생성하세요.`);
                return false;
            }
            
            alert(`프로필 저장 실패: ${error.message}`);
            return false;
        }
        
        console.log("✅ 프로필 저장 성공:", data);
        updateLastAction('프로필 저장 완료!');
        
        // 성공 시 버튼 상태 변경
        if (submitButton) {
            submitButton.textContent = '저장 완료! 매칭으로 이동 중...';
            submitButton.style.backgroundColor = '#28a745';
            submitButton.style.color = '#fff';
        }
        
        // 성공 알림
        alert("프로필이 성공적으로 저장되었습니다!\n매칭 페이지로 이동합니다.");
        
        // 매칭 페이지로 이동
        console.log("매칭 페이지로 이동 중...");
        setTimeout(() => {
            window.location.href = 'matching.html';
        }, 1500);
        
        return true;
        
    } catch (error) {
        console.error("=== 프로필 저장 중 예상치 못한 오류 ===");
        console.error("오류:", error);
        updateLastAction(`오류 발생: ${error.message}`);
        alert(`오류가 발생했습니다: ${error.message}`);
        return false;
        
    } finally {
        // 버튼 상태 복원 (실패 시에만)
        if (submitButton && !submitButton.textContent.includes('완료')) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            submitButton.style.backgroundColor = '';
            submitButton.style.color = '';
        }
    }
}

// 글로벌 스코프에서 접근 가능하도록 window 객체에 추가
window.handleProfileSubmit = handleProfileSubmit;

// 폼 데이터 수집
function collectFormData() {
    const nicknameElement = document.getElementById('nickname');
    const genderElement = document.getElementById('gender');
    const birthdateElement = document.getElementById('birthdate');
    const bioElement = document.getElementById('bio');
    const profilePicElement = document.getElementById('profile-pic');
    
    // 요소가 존재하는지 확인 후 값 추출
    const nickname = nicknameElement ? nicknameElement.value.trim() : '';
    const gender = genderElement ? genderElement.value : '';
    const birthdate = birthdateElement ? birthdateElement.value : '';
    const bio = bioElement ? bioElement.value.trim() : '';
    const profilePicFile = profilePicElement && profilePicElement.files ? profilePicElement.files[0] : null;
    
    const formData = {
        nickname,
        gender,
        birthdate,
        bio,
        profilePicFile
    };
    
    console.log("수집된 폼 데이터 상세:", {
        nickname: nickname || '(비어있음)',
        gender: gender || '(비어있음)',
        birthdate: birthdate || '(비어있음)',
        bio: bio || '(비어있음)',
        profilePicFile: profilePicFile ? `${profilePicFile.name} (${profilePicFile.size}bytes)` : '(없음)'
    });
    
    return formData;
}

// 폼 데이터 유효성 검사
function validateFormData(formData) {
    if (!formData.nickname) {
        alert("닉네임을 입력해주세요.");
        return false;
    }
    
    if (!formData.gender) {
        alert("성별을 선택해주세요.");
        return false;
    }
    
    if (!formData.birthdate) {
        alert("생년월일을 입력해주세요.");
        return false;
    }
    
    // 날짜 유효성 검사
    const birthDate = new Date(formData.birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18 || age > 100) {
        alert("나이는 18세 이상 100세 이하여야 합니다.");
        return false;
    }
    
    return true;
}

// 프로필 사진 업로드
async function uploadProfilePicture(file) {
    console.log("=== 프로필 사진 업로드 시작 ===");
    console.log("파일 정보:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    });
    
    try {
        // 파일 크기 검사 (5MB 제한)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error(`프로필 사진은 5MB 이하여야 합니다. 현재 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }
        console.log("파일 크기 검사 통과");
        
        // 파일 형식 검사
        if (!file.type.startsWith('image/')) {
            throw new Error(`이미지 파일만 업로드 가능합니다. 현재 타입: ${file.type}`);
        }
        console.log("파일 형식 검사 통과");
        
        // Storage 경로 생성
        const filePath = `profile_pictures/${currentUser.uid}/${Date.now()}_${file.name}`;
        console.log("Storage 업로드 경로:", filePath);
        
        // Storage 참조 생성
        console.log("Storage 참조 생성 중...");
        const storageRef = storage.ref(filePath);
        console.log("Storage 참조 생성 완료");
        
        // 파일 업로드 시작
        console.log("Firebase Storage 업로드 시작...");
        const startTime = Date.now();
        
        const uploadTask = await storageRef.put(file);
        
        const uploadTime = Date.now();
        console.log(`파일 업로드 완료 (소요시간: ${uploadTime - startTime}ms)`);
        
        // 다운로드 URL 획득
        console.log("다운로드 URL 획득 중...");
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        const endTime = Date.now();
        console.log(`프로필 사진 업로드 전체 완료 (총 소요시간: ${endTime - startTime}ms)`);
        console.log("다운로드 URL:", downloadURL);
        
        return downloadURL;
        
    } catch (error) {
        console.error("=== 프로필 사진 업로드 오류 ===");
        console.error("오류 타입:", error.constructor.name);
        console.error("오류 코드:", error.code);
        console.error("오류 메시지:", error.message);
        console.error("전체 오류 객체:", error);
        throw error;
    }
}

// Supabase에 프로필 데이터 저장
async function saveProfileToSupabase(profileData) {
    console.log("=== Supabase 저장 시작 ===");
    console.log("저장할 프로필 데이터:", profileData);
    
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase 클라이언트가 초기화되지 않았습니다");
        }
        
        console.log("Supabase upsert() 호출 중...");
        const startTime = Date.now();
        
        // upsert를 사용해서 존재하면 업데이트, 없으면 생성
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .upsert(profileData, { 
                onConflict: 'user_id' // user_id가 같으면 업데이트
            })
            .select();
        
        if (error) {
            console.error("Supabase 오류 상세:", error);
            
            // 테이블이 존재하지 않는 경우 자동 생성 시도
            if (error.code === '42P01' || error.message.includes('relation "profiles" does not exist')) {
                console.error("❌ profiles 테이블이 존재하지 않습니다!");
                console.log("🔧 자동으로 테이블을 생성을 시도합니다...");
                
                // 간단한 테이블 생성 시도
                try {
                    console.log("테이블 생성 중...");
                    
                    // 직접 SQL로 테이블 생성 시도
                    const createTableResult = await window.supabaseClient.rpc('create_profiles_table');
                    console.log("테이블 생성 결과:", createTableResult);
                    
                    // 테이블 생성 후 다시 저장 시도
                    console.log("테이블 생성 후 다시 저장 시도...");
                    const { data: retryData, error: retryError } = await window.supabaseClient
                        .from('profiles')
                        .upsert(profileData, { onConflict: 'user_id' })
                        .select();
                    
                    if (retryError) {
                        throw retryError;
                    }
                    
                    console.log("✅ 테이블 생성 및 저장 성공!");
                    return retryData;
                    
                } catch (createError) {
                    console.error("테이블 자동 생성 실패:", createError);
                    
                    // 수동 생성 안내
                    throw new Error(`
프로필 테이블이 존재하지 않습니다.

🔧 해결 방법:
1. 페이지 하단의 "🔧 디버깅 패널 토글" 클릭
2. "📋 Supabase 테이블 생성" 버튼 클릭

또는 수동으로:
1. https://app.supabase.com 접속
2. 프로젝트 선택 (wamndgvguaybvgoudpxm)  
3. SQL Editor에서 다음 실행:

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON profiles 
FOR ALL USING (true);`);
                }
            }
            
            // 기타 오류
            throw new Error(`프로필 저장 실패: ${error.message}`);
        }
        
        const endTime = Date.now();
        console.log(`✅ Supabase 저장 완료 (소요시간: ${endTime - startTime}ms)`);
        console.log("저장된 데이터:", data);
        
        return data;
        
    } catch (error) {
        console.error("=== Supabase 저장 오류 ===");
        console.error("오류 타입:", error.constructor.name);
        console.error("오류 메시지:", error.message);
        console.error("전체 오류 객체:", error);
        throw error;
    }
}

// Supabase에서 기존 프로필 확인
async function checkExistingProfileSupabase(userId) {
    try {
        console.log("Supabase에서 기존 프로필 확인 중...");
        
        if (!window.supabaseClient) {
            console.warn("Supabase 클라이언트가 없음 - 프로필 확인 건너뛰기");
            return null;
        }
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }
        
        if (data) {
            console.log("기존 프로필 데이터 발견:", data);
            
            // 필수 필드가 모두 있는지 확인
            const requiredFields = ['nickname', 'gender', 'birthdate'];
            const isComplete = requiredFields.every(field => 
                data[field] && data[field].toString().trim() !== ''
            );
            
            if (isComplete) {
                console.log("완성된 프로필 발견");
                return data;
            } else {
                console.log("불완전한 프로필 - 계속 작성 가능");
                return null;
            }
        } else {
            console.log("기존 프로필 없음");
            return null;
        }
        
    } catch (error) {
        console.error("Supabase 프로필 확인 오류:", error);
        return null;
    }
}

// 네트워크 연결 상태 확인 및 Firebase 재연결
async function checkAndReconnectFirebase() {
    updateLastAction('네트워크 연결 상태 확인 중...');
    
    try {
        // 네트워크 연결 상태 확인
        if (!navigator.onLine) {
            throw new Error('인터넷 연결이 끊어졌습니다. 네트워크 연결을 확인해주세요.');
        }
        
        console.log("네트워크 연결 상태: 온라인");
        
        // Firebase 서비스 재연결 확인
        if (auth) {
            console.log("Firebase Auth 서비스 재연결 확인...");
            
            // 현재 사용자 상태 확인
            const user = auth.currentUser;
            console.log("현재 사용자 상태:", user ? '로그인됨' : '로그아웃됨');
            
            console.log("✅ Firebase 서비스 정상 작동");
            updateDebugStatus('firebase', '✅ 재연결됨');
            updateLastAction('Firebase 재연결 완료');
            
            return true;
        } else {
            throw new Error('Firebase가 초기화되지 않았습니다.');
        }
        
    } catch (error) {
        console.error("Firebase 재연결 실패:", error);
        updateDebugStatus('firebase', `❌ 재연결 실패: ${error.message}`);
        updateLastAction(`재연결 실패: ${error.message}`);
        return false;
    }
}

// 네트워크 상태 모니터링
function setupNetworkMonitoring() {
    // 초기 네트워크 상태 확인
    function checkNetworkStatus() {
        const isOnline = navigator.onLine;
        console.log(`네트워크 상태: ${isOnline ? '온라인' : '오프라인'}`);
        
        if (isOnline) {
            updateDebugStatus('firebase', '🟢 온라인');
            updateLastAction('네트워크 연결 정상');
        } else {
            updateDebugStatus('firebase', '🔴 오프라인');
            updateLastAction('네트워크 연결 끊어짐');
        }
        
        return isOnline;
    }
    
    // 네트워크 상태 변경 리스너
    window.addEventListener('online', () => {
        console.log('네트워크 연결 복구됨');
        updateDebugStatus('firebase', '🟢 온라인 복구됨');
        updateLastAction('네트워크 연결 복구 - Firebase 재연결 시도...');
        
        // 네트워크 복구 시 Firebase 재연결 시도
        setTimeout(() => {
            checkAndReconnectFirebase();
        }, 1000);
    });
    
    window.addEventListener('offline', () => {
        console.log('네트워크 연결 끊어짐');
        updateDebugStatus('firebase', '🔴 오프라인');
        updateLastAction('네트워크 연결 끊어짐');
    });
    
    // 초기 상태 확인
    checkNetworkStatus();
}

// Supabase 테이블 자동 생성 함수 (향상된 버전)
async function createProfilesTableAutomatically() {
    console.log("=== Supabase 테이블 자동 생성 시작 ===");
    updateLastAction('테이블 생성 시작...');
    
    if (!window.supabaseClient) {
        alert("Supabase 클라이언트가 초기화되지 않았습니다.");
        return false;
    }
    
    try {
        // 1단계: 먼저 테이블이 이미 존재하는지 확인
        console.log("1. 기존 테이블 존재 여부 확인...");
        const { data: existingData, error: checkError } = await window.supabaseClient
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (!checkError) {
            console.log("✅ 테이블이 이미 존재합니다!");
            alert("프로필 테이블이 이미 존재합니다!");
            updateLastAction('테이블이 이미 존재함');
            return true;
        }
        
        console.log("테이블이 존재하지 않음. 생성을 시도합니다...");
        
        // 2단계: SQL을 통한 테이블 생성 시도
        console.log("2. SQL을 통한 테이블 생성 시도...");
        
        const createTableSQL = `
            -- 프로필 테이블 생성
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
            
            -- RLS (Row Level Security) 활성화
            ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
            
            -- 모든 사용자에게 접근 권한 부여 (개발용)
            DROP POLICY IF EXISTS "Enable all access for all users" ON profiles;
            CREATE POLICY "Enable all access for all users" ON profiles 
                FOR ALL USING (true);
        `;
        
        // SQL 실행 시도
        const { data: sqlData, error: sqlError } = await window.supabaseClient.rpc('exec_sql', {
            sql_query: createTableSQL
        });
        
        if (sqlError) {
            console.log("RPC 방식 실패, 다른 방법 시도...");
            
            // 3단계: 간접적인 방법으로 테이블 생성 확인
            console.log("3. 테스트 데이터 삽입을 통한 테이블 생성 확인...");
            
            const testProfile = {
                user_id: 'test_table_creation_' + Date.now(),
                email: 'test@table.creation',
                nickname: 'Test',
                gender: 'other',
                birthdate: '2000-01-01',
                bio: 'Table creation test'
            };
            
            const { data: testData, error: testError } = await window.supabaseClient
                .from('profiles')
                .insert(testProfile)
                .select();
            
            if (testError) {
                console.error("테이블 생성 실패:", testError);
                
                // 수동 생성 안내
                alert(`자동 테이블 생성에 실패했습니다.

📋 수동 생성 방법:
1. https://app.supabase.com 접속
2. 프로젝트 선택 (wamndgvguaybvgoudpxm)
3. SQL Editor 클릭
4. 다음 SQL 실행:

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access" ON profiles FOR ALL USING (true);

그 후 이 페이지를 새로고침하세요.`);
                
                updateLastAction('테이블 수동 생성 필요');
                return false;
            }
            
            // 테스트 데이터 삭제
            await window.supabaseClient
                .from('profiles')
                .delete()
                .eq('user_id', testProfile.user_id);
        }
        
        console.log("✅ 테이블 생성 성공!");
        
        // 4단계: 생성 완료 후 검증
        const { data: verifyData, error: verifyError } = await window.supabaseClient
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (verifyError) {
            throw new Error(`테이블 검증 실패: ${verifyError.message}`);
        }
        
        console.log("✅ 테이블 검증 완료!");
        updateLastAction('테이블 생성 및 검증 완료');
        
        alert("✅ 프로필 테이블이 성공적으로 생성되었습니다!\n이제 프로필을 저장할 수 있습니다.");
        
        return true;
        
    } catch (error) {
        console.error("테이블 생성 중 오류:", error);
        updateLastAction(`테이블 생성 오류: ${error.message}`);
        
        alert(`테이블 생성 중 오류가 발생했습니다: ${error.message}\n\n수동으로 Supabase 대시보드에서 테이블을 생성해주세요.`);
        
        return false;
    }
}

// 테스트용 간단한 프로필 저장 함수
async function testProfileSave() {
    console.log("=== 테스트 프로필 저장 시작 ===");
    
    if (!currentUser) {
        alert("로그인이 필요합니다.");
        return false;
    }
    
    if (!window.supabaseClient) {
        alert("Supabase 클라이언트가 초기화되지 않았습니다.");
        return false;
    }
    
    try {
        // 간단한 테스트 데이터
        const testProfile = {
            user_id: currentUser.uid,
            email: currentUser.email,
            nickname: 'TestUser',
            gender: 'other',
            birthdate: '2000-01-01',
            bio: 'Test profile',
            profile_picture_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log("테스트 데이터:", testProfile);
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .upsert(testProfile, { onConflict: 'user_id' })
            .select();
        
        if (error) {
            console.error("테스트 저장 실패:", error);
            alert(`테스트 저장 실패: ${error.message}`);
            return false;
        }
        
        console.log("✅ 테스트 저장 성공:", data);
        alert("테스트 프로필 저장 성공! 이제 실제 프로필을 저장해보세요.");
        return true;
        
    } catch (error) {
        console.error("테스트 중 오류:", error);
        alert(`테스트 중 오류: ${error.message}`);
        return false;
    }
}

// Supabase 연결 테스트
async function testSupabaseConnection() {
    updateLastAction('Supabase 연결 테스트 시작');
    console.log("=== Supabase 연결 테스트 시작 ===");
    
    try {
        if (!window.supabaseClient) {
            console.log("Supabase 클라이언트가 없음. 초기화 시도...");
            const initialized = initializeSupabase();
            if (!initialized || !window.supabaseClient) {
                throw new Error('Supabase 클라이언트 초기화 실패');
            }
        }
        
        // 1. 기본 연결 테스트
        console.log("1. Supabase 기본 연결 테스트...");
        const { data: authData, error: authError } = await window.supabaseClient.auth.getUser();
        
        if (authError && authError.message !== 'Auth session missing!') {
            throw authError;
        }
        
        console.log("✅ Supabase 인증 서비스 연결됨");
        
        // 2. 프로필 테이블 접근 테스트
        console.log("2. 프로필 테이블 접근 테스트...");
        const { data: profileData, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (profileError) {
            if (profileError.code === '42P01') {
                console.warn("⚠️ 프로필 테이블이 존재하지 않음");
                updateDebugStatus('supabase', '⚠️ 테이블 없음');
                updateLastAction('Supabase 연결됨 (테이블 생성 필요)');
                
                alert(`Supabase 연결은 성공했지만 프로필 테이블이 없습니다.

"📋 Supabase 테이블 생성" 버튼을 클릭하여 테이블을 생성하세요.`);
                
                return true; // 연결은 성공
            } else {
                throw profileError;
            }
        }
        
        console.log("✅ 프로필 테이블 접근 성공");
        
        // 3. 쓰기 권한 테스트 (옵션)
        if (currentUser) {
            console.log("3. 쓰기 권한 테스트...");
            
            const testData = {
                user_id: 'connection_test_' + Date.now(),
                email: 'test@connection.test',
                nickname: 'ConnectionTest',
                gender: 'other',
                birthdate: '2000-01-01'
            };
            
            const { data: writeData, error: writeError } = await window.supabaseClient
                .from('profiles')
                .insert(testData)
                .select();
            
            if (writeError) {
                console.warn("쓰기 테스트 실패:", writeError.message);
                console.log("✅ 읽기 권한은 있음");
            } else {
                console.log("✅ 쓰기 권한도 확인됨");
                
                // 테스트 데이터 삭제
                await window.supabaseClient
                    .from('profiles')
                    .delete()
                    .eq('user_id', testData.user_id);
                
                console.log("✅ 테스트 데이터 정리 완료");
            }
        }
        
        updateDebugStatus('supabase', '✅ 연결됨');
        updateLastAction('Supabase 연결 테스트 완료');
        
        alert("✅ Supabase 연결 테스트 성공!\n모든 기능이 정상 작동합니다.");
        
        return true;
        
    } catch (error) {
        console.error('Supabase 연결 테스트 오류:', error);
        updateDebugStatus('supabase', `❌ 오류: ${error.message}`);
        updateLastAction(`Supabase 연결 테스트 실패: ${error.message}`);
        
        alert(`Supabase 연결 테스트 실패: ${error.message}`);
        
        return false;
    }
}

console.log("profile.js 로드 완료");

// 주요 함수들을 글로벌 스코프에서 접근 가능하도록 설정
window.toggleDebugPanel = toggleDebugPanel;
window.testFirebaseConnection = testFirebaseConnection;
window.testSupabaseConnection = testSupabaseConnection;
window.testProfileSave = testProfileSave;
window.createProfilesTableAutomatically = createProfilesTableAutomatically;
window.ensureProfilesTableExists = ensureProfilesTableExists;
window.checkAndReconnectFirebase = checkAndReconnectFirebase;

// 테이블 존재 여부 확인 함수
async function ensureProfilesTableExists() {
    console.log("=== 프로필 테이블 존재 여부 확인 ===");
    updateLastAction('테이블 존재 여부 확인 중...');
    
    if (!window.supabaseClient) {
        alert("Supabase 클라이언트가 초기화되지 않았습니다.");
        return false;
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (error) {
            if (error.code === '42P01') {
                console.log("❌ 프로필 테이블이 존재하지 않습니다.");
                updateLastAction('테이블이 존재하지 않음');
                alert("프로필 테이블이 존재하지 않습니다.\n'📋 Supabase 테이블 생성' 버튼을 클릭하여 테이블을 생성하세요.");
                return false;
            } else {
                throw error;
            }
        }
        
        console.log("✅ 프로필 테이블이 존재합니다.");
        updateLastAction('테이블 존재 확인됨');
        alert("✅ 프로필 테이블이 존재하고 정상 작동합니다!");
        return true;
        
    } catch (error) {
        console.error("테이블 확인 중 오류:", error);
        updateLastAction(`테이블 확인 오류: ${error.message}`);
        alert(`테이블 확인 중 오류: ${error.message}`);
        return false;
    }
}

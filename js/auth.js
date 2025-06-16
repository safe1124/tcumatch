console.log("auth.js 시작됨");

// Firebase가 로드되었는지 확인
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK가 로드되지 않았습니다.');
    alert('Firebase 초기화 오류가 발생했습니다.');
} else {
    console.log("Firebase SDK 로드 확인됨");
}

// Firebase 서비스 초기화
let auth, db, provider;

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 로드 완료, Firebase 서비스 초기화 중...");
    
    try {
        auth = firebase.auth();
        db = firebase.firestore();
        provider = new firebase.auth.GoogleAuthProvider();
        
        console.log("Firebase 서비스 초기화 완료");
        
        // 버튼 이벤트 리스너 등록
        setupEventListeners();
        
        // 인증 상태 변화 리스너 등록
        setupAuthStateListener();
        
    } catch (error) {
        console.error("Firebase 서비스 초기화 오류:", error);
        alert('Firebase 초기화 중 오류가 발생했습니다.');
    }
});

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log("이벤트 리스너 설정 중...");
    
    // 모든 가능한 Google 로그인 버튼 찾기
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    
    if (googleSignInBtn) {
        console.log("google-signin-btn 버튼 찾음");
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    if (googleLoginBtn) {
        console.log("google-login-btn 버튼 찾음");
        googleLoginBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    if (!googleSignInBtn && !googleLoginBtn) {
        console.warn("Google 로그인 버튼을 찾을 수 없습니다.");
    }
}

// Google 로그인 처리
async function handleGoogleSignIn() {
    console.log("Google 로그인 버튼이 클릭되었습니다.");
    
    if (!auth || !provider) {
        console.error("Firebase Auth가 초기화되지 않았습니다.");
        alert("인증 서비스 초기화 오류");
        return;
    }
    
    try {
        console.log("Google 로그인 팝업 실행 중...");
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log("Google 로그인 성공:", user);
        
        // 프로필 존재 여부 확인
        const profileExists = await checkUserProfileExists(user.uid);
        
        if (profileExists) {
            console.log("프로필 존재함 - matching.html로 이동");
            window.location.href = 'matching.html';
        } else {
            console.log("프로필 없음 - profile.html로 이동");
            window.location.href = 'profile.html';
        }
        
    } catch (error) {
        console.error("Google 로그인 오류:", error);
        
        // 사용자에게 친화적인 오류 메시지
        let errorMessage = "로그인 중 오류가 발생했습니다.";
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = "로그인 창이 닫혔습니다. 다시 시도해주세요.";
                break;
            case 'auth/popup-blocked':
                errorMessage = "팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.";
                break;
            case 'auth/unauthorized-domain':
                errorMessage = "인증되지 않은 도메인입니다. Firebase 설정을 확인해주세요.";
                break;
            default:
                errorMessage = `로그인 오류: ${error.message}`;
        }
        
        alert(errorMessage);
    }
}

// 사용자 프로필 존재 여부 확인
async function checkUserProfileExists(uid) {
    console.log(`사용자 프로필 확인 중: ${uid}`);
    
    if (!db) {
        console.error("Firestore가 초기화되지 않았습니다.");
        return false;
    }
    
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            console.log("사용자 프로필 존재함:", userDoc.data());
            return true;
        } else {
            console.log("사용자 프로필 없음");
            return false;
        }
    } catch (error) {
        console.error("프로필 확인 오류:", error);
        return false;
    }
}

// 인증 상태 변화 리스너
function setupAuthStateListener() {
    console.log("인증 상태 리스너 설정 중...");
    
    auth.onAuthStateChanged(async (user) => {
        console.log(`인증 상태 변화 감지 - 페이지: ${window.location.pathname}`);
        
        if (user) {
            console.log("사용자 로그인됨:", user.uid);
            await handleAuthenticatedUser(user);
        } else {
            console.log("사용자 로그아웃됨");
            handleUnauthenticatedUser();
        }
    });
}

// 인증된 사용자 처리
async function handleAuthenticatedUser(user) {
    const currentPath = window.location.pathname;
    const isOnAuthPage = currentPath.includes('index.html') || 
                        currentPath.includes('login.html') || 
                        currentPath.includes('signup.html') ||
                        currentPath === '/';
    
    const isOnProfilePage = currentPath.includes('profile.html');
    
    if (isOnAuthPage) {
        console.log("인증 페이지에 있음 - 프로필 확인 후 리디렉션");
        
        const profileExists = await checkUserProfileExists(user.uid);
        
        if (profileExists) {
            console.log("프로필 존재 - matching.html로 리디렉션");
            window.location.href = 'matching.html';
        } else {
            console.log("프로필 없음 - profile.html로 리디렉션");
            window.location.href = 'profile.html';
        }
    } else if (isOnProfilePage) {
        console.log("프로필 페이지에 있음 - 프로필 존재 여부 확인");
        
        const profileExists = await checkUserProfileExists(user.uid);
        
        if (profileExists) {
            console.log("프로필이 이미 존재함 - matching.html로 리디렉션");
            window.location.href = 'matching.html';
        }
    }
}

// 인증되지 않은 사용자 처리
function handleUnauthenticatedUser() {
    const currentPath = window.location.pathname;
    const isProtectedPage = currentPath.includes('profile.html') || 
                           currentPath.includes('matching.html') ||
                           currentPath.includes('chat_list.html') ||
                           currentPath.includes('chat.html');
    
    if (isProtectedPage) {
        console.log("보호된 페이지에서 비인증 상태 - 로그인 페이지로 리디렉션");
        window.location.href = 'index.html';
    }
}

console.log("auth.js 로드 완료");

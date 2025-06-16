// 매칭 페이지 JavaScript - Pairs 스타일 (Supabase 버전)
let auth, storage;
let currentUser = null;
let allUsers = [];
let currentUserIndex = 0;
let userInteractions = new Set(); // 이미 처리한 사용자들

document.addEventListener('DOMContentLoaded', () => {
    console.log("매칭 페이지 로드");
    
    try {
        // Firebase 서비스 초기화 (인증용만)
        auth = firebase.auth();
        storage = firebase.storage();
        
        // Supabase 초기화
        initializeSupabase();
        
        // 필요한 테이블들이 존재하는지 확인 (비동기로)
        ensureRequiredTablesExist();
        
        // 인증 상태 리스너
        auth.onAuthStateChanged(async (user) => {
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
                
                // 테스트 모드에서는 프로필 확인 건너뛰기
                console.log("🧪 테스트 모드 - 프로필 확인 건너뛰기");
                
                // 테스트용 프로필 데이터 자동 생성
                await createTestProfilesIfNeeded();
                
                await loadUsers();
                return;
            }
            
            // 실제 사용자 로그인된 경우
            currentUser = user;
            console.log("사용자 인증됨:", user.email);
            
            // 현재 사용자의 프로필이 있는지 확인 (Supabase)
            const hasProfile = await checkUserProfile();
            if (!hasProfile) {
                console.log("❌ 프로필이 없음 - profile.html로 이동");
                alert("먼저 프로필을 생성해주세요.");
                window.location.href = 'profile.html';
                return;
            }
            
            console.log("✅ 프로필 확인 완료 - 사용자 로드 시작");
            // 사용자들 로드
            await loadUsers();
        });
        
    } catch (error) {
        console.error("초기화 오류:", error);
        alert('초기화 오류가 발생했습니다.');
    }
});

// 현재 사용자의 프로필 확인 (Supabase 사용)
async function checkUserProfile() {
    console.log("=== 사용자 프로필 확인 시작 ===");
    console.log("현재 사용자:", currentUser);
    
    try {
        if (!window.supabaseClient) {
            console.error("❌ Supabase 클라이언트가 초기화되지 않았습니다.");
            return false;
        }
        
        console.log("Supabase에서 프로필 조회 중...", currentUser.uid);
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.uid)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error("❌ 프로필 확인 오류:", error);
            return false;
        }
        
        if (error && error.code === 'PGRST116') {
            console.log("⚠️ 프로필이 존재하지 않음 (PGRST116)");
            return false;
        }
        
        if (data) {
            console.log("✅ 프로필 데이터 발견:", data);
            
            // 필수 필드 확인
            const requiredFields = ['nickname', 'gender', 'birthdate'];
            const isComplete = requiredFields.every(field => 
                data[field] && data[field].toString().trim() !== ''
            );
            
            console.log("필수 필드 확인 결과:", isComplete);
            console.log("필드별 상태:", {
                nickname: data.nickname ? '✅' : '❌',
                gender: data.gender ? '✅' : '❌', 
                birthdate: data.birthdate ? '✅' : '❌'
            });
            
            return isComplete;
        }
        
        console.log("⚠️ 프로필 데이터가 없음");
        return false;
        
    } catch (error) {
        console.error("❌ 프로필 확인 중 예상치 못한 오류:", error);
        return false;
    }
}

// 테스트용 프로필 데이터 생성
async function createTestProfilesIfNeeded() {
    console.log("=== 테스트 프로필 데이터 확인 및 생성 ===");
    
    if (!window.supabaseClient) {
        console.warn("⚠️ Supabase 클라이언트가 없음 - 테스트 프로필 생성 건너뛰기");
        return;
    }
    
    try {
        // 기존 프로필 수 확인
        const { data: existingProfiles, error: countError } = await window.supabaseClient
            .from('profiles')
            .select('id');
        
        if (countError && countError.code !== '42P01') {
            console.error("프로필 수 확인 오류:", countError);
            return;
        }
        
        const profileCount = existingProfiles ? existingProfiles.length : 0;
        console.log(`현재 프로필 수: ${profileCount}`);
        
        if (profileCount < 3) {
            console.log("테스트 프로필 부족 - 추가 생성 중...");
            
            const testProfiles = [
                {
                    user_id: 'test_user_alice_001',
                    email: 'alice@example.com',
                    nickname: '앨리스',
                    gender: 'female',
                    birthdate: '1995-03-15',
                    bio: '안녕하세요! 책 읽기와 영화 감상을 좋아합니다.',
                    profile_picture_url: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    user_id: 'test_user_bob_002',
                    email: 'bob@example.com',
                    nickname: '밥',
                    gender: 'male',
                    birthdate: '1993-07-22',
                    bio: '음악과 여행을 사랑하는 사람입니다.',
                    profile_picture_url: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    user_id: 'test_user_charlie_003',
                    email: 'charlie@example.com',
                    nickname: '찰리',
                    gender: 'other',
                    birthdate: '1997-11-08',
                    bio: '운동과 요리에 관심이 많습니다!',
                    profile_picture_url: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            
            for (const profile of testProfiles) {
                const { error: insertError } = await window.supabaseClient
                    .from('profiles')
                    .upsert(profile, { onConflict: 'user_id' });
                
                if (insertError) {
                    console.error(`${profile.nickname} 프로필 생성 실패:`, insertError);
                } else {
                    console.log(`✅ ${profile.nickname} 프로필 생성 성공`);
                }
            }
            
            console.log("✅ 테스트 프로필 생성 완료");
        } else {
            console.log("✅ 충분한 프로필 데이터 존재");
        }
        
    } catch (error) {
        console.error("테스트 프로필 생성 중 오류:", error);
    }
}

// 필수 테이블 존재 확인 및 생성
async function ensureRequiredTablesExist() {
    console.log("=== 필수 테이블 존재 확인 시작 ===");
    
    const requiredTables = ['profiles', 'interactions', 'matches'];
    
    for (const tableName of requiredTables) {
        try {
            console.log(`🔍 ${tableName} 테이블 확인 중...`);
            
            // 테이블에서 1개 row 조회 시도 (테이블 존재 확인용)
            const { data, error } = await window.supabaseClient
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error && error.code === '42P01') {
                console.log(`❌ ${tableName} 테이블이 존재하지 않음`);
                console.log(`📋 ${tableName} 테이블을 수동으로 생성해주세요.`);
            } else if (error) {
                console.log(`⚠️ ${tableName} 테이블 확인 중 오류:`, error);
            } else {
                console.log(`✅ ${tableName} 테이블 존재 확인됨`);
            }
        } catch (error) {
            console.error(`❌ ${tableName} 테이블 확인 중 예외:`, error);
        }
    }
    
    console.log("=== 테이블 확인 완료 ===");
}

// 매칭 대상 사용자들 로드 (Supabase 사용)
async function loadUsers() {
    try {
        console.log("사용자 목록 로드 중...");
        showLoading();
        
        if (!window.supabaseClient) {
            console.error("Supabase 클라이언트가 초기화되지 않았습니다.");
            hideLoading();
            return;
        }
        
        // 이미 상호작용한 사용자들 로드 (임시로 비활성화)
        // await loadUserInteractions();
        
        // 모든 사용자 로드 (자신 제외)
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .neq('user_id', currentUser.uid);
        
        if (error) {
            console.error("사용자 로드 오류:", error);
            hideLoading();
            return;
        }
        
        allUsers = [];
        if (profiles) {
            profiles.forEach(profile => {
                // 완성된 프로필만 포함
                const requiredFields = ['nickname', 'gender', 'birthdate'];
                const isComplete = requiredFields.every(field => 
                    profile[field] && profile[field].toString().trim() !== ''
                );
                
                if (isComplete) { // 상호작용 체크 임시 제거
                    allUsers.push({
                        id: profile.user_id,
                        ...profile
                    });
                }
            });
        }
        
        console.log(`로드된 사용자 수: ${allUsers.length}`);
        
        // 사용자 순서 섞기
        shuffleArray(allUsers);
        
        currentUserIndex = 0;
        showNextUser();
        
    } catch (error) {
        console.error("사용자 로드 오류:", error);
        showError("사용자를 불러올 수 없습니다.");
    }
}

// 이미 상호작용한 사용자들 로드
async function loadUserInteractions() {
    try {
        const interactionsSnapshot = await db.collection('interactions')
            .where('fromUserId', '==', currentUser.uid)
            .get();
        
        interactionsSnapshot.forEach(doc => {
            const data = doc.data();
            userInteractions.add(data.toUserId);
        });
        
        console.log(`이미 상호작용한 사용자 수: ${userInteractions.size}`);
    } catch (error) {
        console.error("상호작용 기록 로드 오류:", error);
    }
}

// 배열 섞기 함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 다음 사용자 표시
function showNextUser() {
    hideLoading();
    
    if (currentUserIndex >= allUsers.length) {
        showNoMoreCards();
        return;
    }
    
    const user = allUsers[currentUserIndex];
    createProfileCard(user);
}

// 프로필 카드 생성
function createProfileCard(user) {
    const cardContainer = document.getElementById('card-container');
    
    // 기존 카드 제거
    const existingCard = cardContainer.querySelector('.profile-card');
    if (existingCard) {
        existingCard.remove();
    }
    
    // 나이 계산
    const age = calculateAge(user.birthdate);
    
    // 성별 텍스트
    const genderText = getGenderText(user.gender);
    
    // 카드 HTML 생성
    const cardHTML = `
        <div class="profile-card" id="current-card">
            <div class="profile-image-container">
                ${user.profilePictureURL ? 
                    `<img src="${user.profilePictureURL}" alt="프로필 사진" class="profile-image">` :
                    `<div class="profile-placeholder">👤</div>`
                }
                <div class="age-badge">${age}세</div>
            </div>
            <div class="profile-info">
                <div class="profile-name">${user.nickname}</div>
                <div class="profile-details">${genderText}</div>
                <div class="profile-bio">${user.bio || '안녕하세요! 잘 부탁드립니다.'}</div>
            </div>
        </div>
    `;
    
    cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    
    // 스와이프 이벤트 추가
    const card = document.getElementById('current-card');
    addSwipeEvents(card);
}

// 스와이프 이벤트 추가
function addSwipeEvents(card) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    // 터치 이벤트
    card.addEventListener('touchstart', handleStart, { passive: false });
    card.addEventListener('touchmove', handleMove, { passive: false });
    card.addEventListener('touchend', handleEnd, { passive: false });
    
    // 마우스 이벤트
    card.addEventListener('mousedown', handleStart);
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseup', handleEnd);
    card.addEventListener('mouseleave', handleEnd);
    
    function handleStart(e) {
        e.preventDefault();
        isDragging = true;
        card.classList.add('dragging');
        
        const point = e.touches ? e.touches[0] : e;
        startX = point.clientX;
        startY = point.clientY;
    }
    
    function handleMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const point = e.touches ? e.touches[0] : e;
        currentX = point.clientX - startX;
        currentY = point.clientY - startY;
        
        // 카드 움직임과 회전
        const rotation = currentX * 0.1;
        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
        
        // 투명도 조절
        const opacity = 1 - Math.abs(currentX) / 300;
        card.style.opacity = Math.max(opacity, 0.5);
    }
    
    function handleEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        card.classList.remove('dragging');
        
        const threshold = 100;
        
        if (Math.abs(currentX) > threshold) {
            // 스와이프 완료
            if (currentX > 0) {
                // 오른쪽 스와이프 (좋아요)
                swipeRight();
            } else {
                // 왼쪽 스와이프 (패스)
                swipeLeft();
            }
        } else {
            // 원래 위치로 복귀
            card.style.transform = '';
            card.style.opacity = '';
        }
        
        currentX = 0;
        currentY = 0;
    }
}

// 왼쪽 스와이프 (패스)
function swipeLeft() {
    const card = document.getElementById('current-card');
    card.classList.add('card-exit-left');
    
    setTimeout(() => {
        passUser();
    }, 300);
}

// 오른쪽 스와이프 (좋아요)
function swipeRight() {
    const card = document.getElementById('current-card');
    card.classList.add('card-exit-right');
    
    setTimeout(() => {
        likeUser();
    }, 300);
}

// 사용자 좋아요
async function likeUser() {
    console.log("❤️ likeUser 함수 호출됨");
    
    // 디버깅 정보 업데이트
    if (typeof window.updateDebugInfo === 'function') {
        window.updateDebugInfo('좋아요');
    }
    
    if (currentUserIndex >= allUsers.length) {
        console.log("❌ 더 이상 사용자가 없음");
        return;
    }
    
    const likedUser = allUsers[currentUserIndex];
    console.log("사용자 좋아요:", likedUser.nickname);
    
    try {
        if (!window.supabaseClient) {
            console.error("❌ Supabase 클라이언트가 없음");
            nextUser(); // 일단 다음 사용자로 이동
            return;
        }
        
        // 상호작용 기록 저장 (Supabase 사용)
        const { data, error } = await window.supabaseClient
            .from('interactions')
            .insert([{
                from_user_id: currentUser.uid,
                to_user_id: likedUser.user_id,
                type: 'like',
                created_at: new Date().toISOString()
            }]);
        
        if (error) {
            console.error("❌ 상호작용 저장 오류:", error);
        } else {
            console.log("✅ 좋아요 상호작용 저장됨:", data);
        }
        
        // 매칭 확인 (상대방도 나를 좋아했는지)
        const mutualLike = await checkMutualLike(likedUser.user_id);
        if (mutualLike) {
            // 매칭 성공!
            await createMatch(likedUser.user_id);
            showMatchSuccess(likedUser);
        }
        
        userInteractions.add(likedUser.user_id);
        nextUser();
        
    } catch (error) {
        console.error("❌ 좋아요 처리 오류:", error);
        nextUser(); // 오류가 발생해도 다음 사용자로 이동
    }
}

// 사용자 패스
async function passUser() {
    console.log("❌ passUser 함수 호출됨");
    
    // 디버깅 정보 업데이트
    if (typeof window.updateDebugInfo === 'function') {
        window.updateDebugInfo('패스');
    }
    
    if (currentUserIndex >= allUsers.length) {
        console.log("❌ 더 이상 사용자가 없음");
        return;
    }
    
    const passedUser = allUsers[currentUserIndex];
    console.log("사용자 패스:", passedUser.nickname);
    
    try {
        if (!window.supabaseClient) {
            console.error("❌ Supabase 클라이언트가 없음");
            nextUser(); // 일단 다음 사용자로 이동
            return;
        }
        
        // 상호작용 기록 저장 (Supabase 사용)
        const { data, error } = await window.supabaseClient
            .from('interactions')
            .insert([{
                from_user_id: currentUser.uid,
                to_user_id: passedUser.user_id,
                type: 'pass',
                created_at: new Date().toISOString()
            }]);
        
        if (error) {
            console.error("❌ 상호작용 저장 오류:", error);
        } else {
            console.log("✅ 패스 상호작용 저장됨:", data);
        }
        
        userInteractions.add(passedUser.user_id);
        nextUser();
        
    } catch (error) {
        console.error("❌ 패스 처리 오류:", error);
        nextUser(); // 오류가 발생해도 다음 사용자로 이동
    }
}

// 다음 사용자로 이동
function nextUser() {
    currentUserIndex++;
    showNextUser();
}

// 상호 좋아요 확인
async function checkMutualLike(userId) {
    try {
        if (!window.supabaseClient) {
            console.error("❌ Supabase 클라이언트가 없음");
            return false;
        }
        
        console.log("🔍 상호 좋아요 확인 중:", { fromUser: userId, toUser: currentUser.uid });
        
        const { data, error } = await window.supabaseClient
            .from('interactions')
            .select('*')
            .eq('from_user_id', userId)
            .eq('to_user_id', currentUser.uid)
            .eq('type', 'like');
        
        if (error) {
            console.error("❌ 상호 좋아요 확인 오류:", error);
            return false;
        }
        
        const hasMutualLike = data && data.length > 0;
        console.log(hasMutualLike ? "💕 상호 좋아요 발견!" : "❌ 상호 좋아요 없음");
        
        return hasMutualLike;
    } catch (error) {
        console.error("❌ 상호 좋아요 확인 오류:", error);
        return false;
    }
}

// 매칭 생성
async function createMatch(userId) {
    try {
        if (!window.supabaseClient) {
            console.error("❌ Supabase 클라이언트가 없음");
            return;
        }
        
        console.log("💕 매칭 생성 중:", { user1: currentUser.uid, user2: userId });
        
        const matchData = {
            user1_id: currentUser.uid,
            user2_id: userId,
            created_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
        };
        
        const { data, error } = await window.supabaseClient
            .from('matches')
            .insert([matchData]);
        
        if (error) {
            console.error("❌ 매칭 생성 오류:", error);
        } else {
            console.log("✅ 매칭 생성 완료:", data);
        }
    } catch (error) {
        console.error("❌ 매칭 생성 오류:", error);
    }
}

// 매칭 성공 알림 (업데이트된 버전)
function showMatchSuccess(user) {
    const modal = document.getElementById('match-modal');
    const message = document.getElementById('match-message');
    
    message.textContent = `${user.nickname}님과 매칭되었습니다!`;
    modal.style.display = 'flex';
    
    // 매칭된 사용자 ID 저장 (채팅으로 이동 시 사용)
    window.matchedUserId = user.id;
}

// 매칭 모달 닫기
function closeMatchModal() {
    const modal = document.getElementById('match-modal');
    modal.style.display = 'none';
    window.matchedUserId = null;
}

// 채팅하기 버튼
function goToChat() {
    if (window.matchedUserId) {
        // 매칭된 사용자와의 채팅 페이지로 이동
        window.location.href = `chat.html?userId=${window.matchedUserId}`;
    } else {
        // 일반 채팅 목록으로 이동
        window.location.href = 'chat_list.html';
    }
}

// 나이 계산
function calculateAge(birthdate) {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// 성별 텍스트 변환
function getGenderText(gender) {
    switch(gender) {
        case 'male': return '남성';
        case 'female': return '여성';
        case 'other': return '기타';
        default: return '';
    }
}

// 화면 상태 관리
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('no-more-cards').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showNoMoreCards() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('no-more-cards').style.display = 'block';
}

function showError(message) {
    hideLoading();
    alert(message);
}

// 헤더 버튼 함수들
function goToProfile() {
    window.location.href = 'my-profile.html';
}

function goToChats() {
    window.location.href = 'chat_list.html';
}

// 전역 함수로 노출 (onclick 핸들러에서 사용)
window.likeUser = likeUser;
window.passUser = passUser;
window.goToProfile = goToProfile;
window.goToChats = goToChats;

// 디버깅 함수들
window.toggleDebugPanel = function() {
    const panel = document.getElementById('debug-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.updateDebugInfo = function(action = '') {
    const buttonStatus = document.getElementById('button-status');
    const lastAction = document.getElementById('last-action');
    const currentUserDebug = document.getElementById('current-user-debug');
    const totalUsers = document.getElementById('total-users');
    
    if (buttonStatus) buttonStatus.textContent = action ? `${action} 실행됨` : '대기 중';
    if (lastAction) lastAction.textContent = action || '없음';
    if (currentUserDebug) currentUserDebug.textContent = currentUser ? currentUser.uid.substring(0, 10) + '...' : '없음';
    if (totalUsers) totalUsers.textContent = allUsers ? allUsers.length : '0';
    
    console.log(`🔧 디버그 업데이트: ${action}`);
};

console.log("매칭 JavaScript 로드 완료");
console.log("✅ 전역 함수 노출 완료: likeUser, passUser, goToProfile, goToChats");

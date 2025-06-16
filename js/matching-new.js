// 매칭 페이지 JavaScript - Pairs 스타일
let auth, db, storage;
let currentUser = null;
let allUsers = [];
let currentUserIndex = 0;
let userInteractions = new Set(); // 이미 처리한 사용자들

document.addEventListener('DOMContentLoaded', () => {
    console.log("매칭 페이지 로드");
    
    try {
        // Firebase 서비스 초기화
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        
        // 인증 상태 리스너
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                console.log("사용자 인증됨:", user.email);
                
                // 현재 사용자의 프로필이 있는지 확인
                const hasProfile = await checkUserProfile();
                if (!hasProfile) {
                    alert("먼저 프로필을 생성해주세요.");
                    window.location.href = 'profile.html';
                    return;
                }
                
                // 사용자들 로드
                await loadUsers();
            } else {
                console.log("사용자 인증되지 않음 - 로그인 페이지로 이동");
                window.location.href = 'index.html';
            }
        });
        
    } catch (error) {
        console.error("Firebase 초기화 오류:", error);
        alert('초기화 오류가 발생했습니다.');
    }
});

// 현재 사용자의 프로필 확인
async function checkUserProfile() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            // 필수 필드 확인
            const requiredFields = ['nickname', 'gender', 'birthdate'];
            return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
        }
        
        return false;
    } catch (error) {
        console.error("프로필 확인 오류:", error);
        return false;
    }
}

// 매칭 대상 사용자들 로드
async function loadUsers() {
    try {
        console.log("사용자 목록 로드 중...");
        showLoading();
        
        // 이미 상호작용한 사용자들 로드
        await loadUserInteractions();
        
        // 모든 사용자 로드 (자신 제외)
        const usersSnapshot = await db.collection('users')
            .where(firebase.firestore.FieldPath.documentId(), '!=', currentUser.uid)
            .get();
        
        allUsers = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // 완성된 프로필만 포함
            const requiredFields = ['nickname', 'gender', 'birthdate'];
            const isComplete = requiredFields.every(field => userData[field] && userData[field].trim() !== '');
            
            if (isComplete && !userInteractions.has(doc.id)) {
                allUsers.push({
                    id: doc.id,
                    ...userData
                });
            }
        });
        
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
    if (currentUserIndex >= allUsers.length) return;
    
    const likedUser = allUsers[currentUserIndex];
    console.log("사용자 좋아요:", likedUser.nickname);
    
    try {
        // 상호작용 기록 저장
        await db.collection('interactions').add({
            fromUserId: currentUser.uid,
            toUserId: likedUser.id,
            type: 'like',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 매칭 확인 (상대방도 나를 좋아했는지)
        const mutualLike = await checkMutualLike(likedUser.id);
        if (mutualLike) {
            // 매칭 성공!
            await createMatch(likedUser.id);
            showMatchSuccess(likedUser);
        }
        
        userInteractions.add(likedUser.id);
        nextUser();
        
    } catch (error) {
        console.error("좋아요 처리 오류:", error);
    }
}

// 사용자 패스
async function passUser() {
    if (currentUserIndex >= allUsers.length) return;
    
    const passedUser = allUsers[currentUserIndex];
    console.log("사용자 패스:", passedUser.nickname);
    
    try {
        // 상호작용 기록 저장
        await db.collection('interactions').add({
            fromUserId: currentUser.uid,
            toUserId: passedUser.id,
            type: 'pass',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        userInteractions.add(passedUser.id);
        nextUser();
        
    } catch (error) {
        console.error("패스 처리 오류:", error);
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
        const snapshot = await db.collection('interactions')
            .where('fromUserId', '==', userId)
            .where('toUserId', '==', currentUser.uid)
            .where('type', '==', 'like')
            .get();
        
        return !snapshot.empty;
    } catch (error) {
        console.error("상호 좋아요 확인 오류:", error);
        return false;
    }
}

// 매칭 생성
async function createMatch(userId) {
    try {
        const matchData = {
            users: [currentUser.uid, userId],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('matches').add(matchData);
        console.log("매칭 생성 완료");
    } catch (error) {
        console.error("매칭 생성 오류:", error);
    }
}

// 매칭 성공 알림
function showMatchSuccess(user) {
    alert(`🎉 ${user.nickname}님과 매칭되었습니다! 채팅을 시작해보세요.`);
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

console.log("매칭 JavaScript 로드 완료");

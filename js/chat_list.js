/* filepath: /Users/shin/Desktop/match/matching-app/my-login-app/js/chat_list.js */
document.addEventListener('DOMContentLoaded', () => {
    console.log("chat_list.js loaded");

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase SDK not loaded or initialized.');
        alert('Firebase 초기화 오류. 콘솔을 확인하세요.');
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const chatListMain = document.getElementById('chat-list-main');
    const noChatsMessage = document.getElementById('no-chats-message');

    let currentUser = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log("User is logged in for chat list page:", currentUser.uid);
            loadChatList();
        } else {
            console.log("User not logged in, redirecting to login page.");
            window.location.href = 'login.html';
        }
    });

    async function loadChatList() {
        if (!currentUser) return;

        try {
            const matchesSnapshot = await db.collection('matches')
                                          .where('users', 'array-contains', currentUser.uid)
                                          .orderBy('matchedAt', 'desc') // Or orderBy lastMessage.timestamp
                                          .get();

            if (matchesSnapshot.empty) {
                noChatsMessage.style.display = 'block';
                return;
            }

            noChatsMessage.style.display = 'none';
            chatListMain.innerHTML = ''; // Clear previous list

            for (const matchDoc of matchesSnapshot.docs) {
                const matchData = matchDoc.data();
                const otherUserId = matchData.users.find(uid => uid !== currentUser.uid);

                if (otherUserId) {
                    const userDoc = await db.collection('users').doc(otherUserId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const listItem = createChatListItem(matchDoc.id, userData, matchData.lastMessage);
                        chatListMain.appendChild(listItem);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading chat list: ", error);
            noChatsMessage.style.display = 'block';
            noChatsMessage.querySelector('p').textContent = '채팅 목록을 불러오는 중 오류가 발생했습니다.';
        }
    }

    function createChatListItem(matchId, userData, lastMessage) {
        const item = document.createElement('div');
        item.classList.add('chat-list-item');
        item.setAttribute('data-match-id', matchId);
        item.setAttribute('data-other-user-id', userData.uid);
        item.setAttribute('data-other-user-name', userData.nickname);

        const img = document.createElement('img');
        img.src = userData.profilePictureURL || 'https://via.placeholder.com/150';
        img.alt = userData.nickname;

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info');

        const nameHeader = document.createElement('h3');
        nameHeader.textContent = userData.nickname;

        const lastMsgP = document.createElement('p');
        if (lastMessage && lastMessage.text) {
            lastMsgP.textContent = lastMessage.text;
        } else {
            lastMsgP.textContent = '아직 대화가 없습니다.';
        }
        // Add timestamp for last message if available

        infoDiv.appendChild(nameHeader);
        infoDiv.appendChild(lastMsgP);
        item.appendChild(img);
        item.appendChild(infoDiv);

        item.addEventListener('click', () => {
            // Navigate to the specific chat page
            window.location.href = `chat.html?matchId=${matchId}&with=${userData.uid}&name=${encodeURIComponent(userData.nickname)}`;
        });

        return item;
    }
});

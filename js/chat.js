/* filepath: /Users/shin/Desktop/match/matching-app/my-login-app/js/chat.js */
document.addEventListener('DOMContentLoaded', () => {
    console.log("chat.js loaded");

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase SDK not loaded or initialized.');
        alert('Firebase 초기화 오류. 콘솔을 확인하세요.');
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    const messagesArea = document.getElementById('messages-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatWithNameElement = document.getElementById('chat-with-name');

    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('matchId');
    const otherUserId = params.get('with');
    const otherUserName = decodeURIComponent(params.get('name'));

    let currentUser = null;
    let unsubscribeMessages = null; // To stop listening to messages when leaving the page

    if (!matchId || !otherUserId || !otherUserName) {
        console.error("Missing URL parameters for chat.");
        alert("채팅 정보를 불러올 수 없습니다.");
        window.location.href = 'chat_list.html';
        return;
    }

    chatWithNameElement.textContent = `${otherUserName}님과의 대화`;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log(`User ${currentUser.uid} entered chat ${matchId} with ${otherUserId}`);
            loadMessages();
        } else {
            console.log("User not logged in, redirecting to login page.");
            window.location.href = 'login.html';
        }
    });

    function loadMessages() {
        if (!currentUser || !matchId) return;

        const messagesRef = db.collection('matches').doc(matchId).collection('messages')
                                .orderBy('timestamp', 'asc'); // Show oldest messages first
        
        unsubscribeMessages = messagesRef.onSnapshot(snapshot => {
            messagesArea.innerHTML = ''; // Clear existing messages
            snapshot.forEach(doc => {
                const message = doc.data();
                displayMessage(message);
            });
            scrollToBottom();
        }, error => {
            console.error("Error fetching messages: ", error);
            alert("메시지를 불러오는 중 오류가 발생했습니다.");
        });
    }

    function displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(message.senderId === currentUser.uid ? 'sent' : 'received');
        
        const textP = document.createElement('p');
        textP.textContent = message.text;
        messageDiv.appendChild(textP);

        if (message.timestamp) {
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('timestamp');
            timestampSpan.textContent = formatTimestamp(message.timestamp);
            messageDiv.appendChild(timestampSpan);
        }
        
        messagesArea.appendChild(messageDiv);
    }

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser || !matchId || !messageInput.value.trim()) return;

        const messageText = messageInput.value.trim();
        messageInput.value = ''; // Clear input field immediately

        try {
            const messageData = {
                senderId: currentUser.uid,
                receiverId: otherUserId, // Good to have for notifications or direct queries
                text: messageText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('matches').doc(matchId).collection('messages').add(messageData);
            
            // Update last message in the match document for chat list previews
            await db.collection('matches').doc(matchId).update({
                lastMessage: {
                    text: messageText,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Use the same server timestamp
                    senderId: currentUser.uid
                }
            });

            console.log("Message sent.");
            scrollToBottom(); // Scroll after sending a new message
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("메시지 전송 중 오류가 발생했습니다.");
            messageInput.value = messageText; // Restore input if sending failed
        }
    });

    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function formatTimestamp(firebaseTimestamp) {
        if (!firebaseTimestamp || !firebaseTimestamp.toDate) {
            return '';
        }
        const date = firebaseTimestamp.toDate();
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }

    // Clean up listener when the user navigates away or closes the tab
    window.addEventListener('beforeunload', () => {
        if (unsubscribeMessages) {
            unsubscribeMessages();
            console.log("Unsubscribed from messages listener.");
        }
    });
});

/* filepath: /Users/shin/Desktop/match/matching-app/my-login-app/js/matching.js */
document.addEventListener('DOMContentLoaded', () => {
    console.log("matching.js loaded");

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase SDK not loaded or initialized.');
        alert('Firebase 초기화 오류. 콘솔을 확인하세요.');
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    const profileDisplayArea = document.getElementById('profile-display-area');
    const profileCardElement = document.getElementById('current-profile-card');
    const profileImgElement = document.getElementById('profile-card-img');
    const profileNicknameElement = document.getElementById('profile-card-nickname');
    const profileGenderElement = document.getElementById('profile-card-gender');
    const profileAgeElement = document.getElementById('profile-card-age');
    const profileBioElement = document.getElementById('profile-card-bio');
    const noMoreProfilesMessage = document.getElementById('no-more-profiles-message');

    const likeButton = document.getElementById('like-btn');
    const passButton = document.getElementById('pass-btn');
    const chatButton = document.getElementById('chat-btn');

    let currentUser = null;
    let displayedUserIds = []; // Keep track of users already shown in this session
    let currentProfile = null; // Store the profile data of the currently displayed user

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log("User is logged in for matching page:", currentUser.uid);
            loadNextProfile();
        } else {
            console.log("User not logged in, redirecting to login page.");
            window.location.href = 'login.html';
        }
    });

    async function loadNextProfile() {
        if (!currentUser) return;

        profileCardElement.style.display = 'none';
        noMoreProfilesMessage.style.display = 'none';

        try {
            console.log("Fetching potential matches...");
            // Fetch users, excluding the current user and those already interacted with (liked/passed)
            // This query needs to be more sophisticated in a real app (e.g., based on preferences, location, etc.)
            // Also, consider users already liked/passed by the current user.
            
            // Get users already interacted with (liked/passed)
            const interactionsSnapshot = await db.collection('interactions')
                                              .where('fromUserId', '==', currentUser.uid)
                                              .get();
            const interactedUserIds = interactionsSnapshot.docs.map(doc => doc.data().toUserId);

            let query = db.collection('users').where('uid', '!=', currentUser.uid);
            
            // Firestore limitation: Cannot use 'not-in' with more than 10 items directly in a single query if combined with other filters.
            // For a larger scale, this needs a more robust solution, possibly involving Cloud Functions or client-side filtering of a broader set.
            // For now, we filter client-side after a broader fetch, or fetch in batches.

            const potentialMatchesSnapshot = await query.limit(30).get(); // Fetch a batch

            const potentialProfiles = [];
            potentialMatchesSnapshot.forEach(doc => {
                const profileData = doc.data();
                if (!interactedUserIds.includes(profileData.uid) && !displayedUserIds.includes(profileData.uid)) {
                    potentialProfiles.push(profileData);
                }
            });

            if (potentialProfiles.length > 0) {
                // Simple random selection for now
                currentProfile = potentialProfiles[Math.floor(Math.random() * potentialProfiles.length)];
                displayProfile(currentProfile);
                displayedUserIds.push(currentProfile.uid); // Add to session displayed list
            } else {
                console.log("No more new profiles to display.");
                noMoreProfilesMessage.style.display = 'block';
                currentProfile = null;
            }
        } catch (error) {
            console.error("Error loading next profile: ", error);
            noMoreProfilesMessage.style.display = 'block';
            noMoreProfilesMessage.querySelector('p').textContent = '프로필 로딩 중 오류가 발생했습니다.';
        }
    }

    function displayProfile(profileData) {
        if (!profileData) return;

        profileImgElement.src = profileData.profilePictureURL || 'https://via.placeholder.com/150'; // Placeholder if no image
        profileImgElement.alt = profileData.nickname;
        profileNicknameElement.textContent = profileData.nickname;
        profileGenderElement.textContent = formatGender(profileData.gender);
        profileAgeElement.textContent = calculateAge(profileData.birthdate);
        profileBioElement.textContent = profileData.bio || '자기소개가 없습니다.';
        
        profileCardElement.style.display = 'block';
        noMoreProfilesMessage.style.display = 'none';
    }

    likeButton.addEventListener('click', () => handleInteraction('like'));
    passButton.addEventListener('click', () => handleInteraction('pass'));

    async function handleInteraction(type) {
        if (!currentUser || !currentProfile) {
            console.log("No current user or profile to interact with.");
            return;
        }

        console.log(`User ${currentUser.uid} ${type}d profile ${currentProfile.uid}`);

        try {
            // Record the interaction
            await db.collection('interactions').add({
                fromUserId: currentUser.uid,
                toUserId: currentProfile.uid,
                type: type, // 'like' or 'pass'
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // If it's a 'like', check for a mutual like (match)
            if (type === 'like') {
                const theirInteraction = await db.collection('interactions')
                                               .where('fromUserId', '==', currentProfile.uid)
                                               .where('toUserId', '==', currentUser.uid)
                                               .where('type', '==', 'like')
                                               .get();
                if (!theirInteraction.empty) {
                    console.log(`It's a MATCH with ${currentProfile.nickname}!`);
                    alert(`🎉 ${currentProfile.nickname}님과 매치되었습니다! 🎉`);
                    // Create a match document
                    await db.collection('matches').add({
                        users: [currentUser.uid, currentProfile.uid],
                        matchedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastMessage: null // For chat feature
                    });
                    // Potentially navigate to a chat screen or show a match notification
                }
            }

            loadNextProfile(); // Load the next profile after interaction
        } catch (error) {
            console.error(`Error handling ${type} interaction: `, error);
            alert(`${type} 처리 중 오류 발생: ${error.message}`);
        }
    }

    chatButton.addEventListener('click', () => {
        // Navigate to a chat list page or open a chat interface
        console.log("Chat button clicked");
        window.location.href = 'chat_list.html'; // Placeholder for chat list page
    });

    // Helper functions
    function formatGender(gender) {
        if (gender === 'male') return '남성';
        if (gender === 'female') return '여성';
        if (gender === 'other') return '기타';
        return '미공개';
    }

    function calculateAge(birthdateString) {
        if (!birthdateString) return '미공개';
        const birthDate = new Date(birthdateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
});

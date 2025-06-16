// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCownvTsPINDjPFmgDFS2nxL_j_9rS9Hv4",
  authDomain: "pairs-fe831.firebaseapp.com",
  projectId: "pairs-fe831",
  storageBucket: "pairs-fe831.appspot.com",
  messagingSenderId: "73063966351",
  appId: "1:73063966351:web:da0dc5cbefb897bde132fa",
  measurementId: "G-LE676XWE5M"
};

console.log("firebase-config.js 시작됨");

// Initialize Firebase using the compat libraries (if not already initialized)
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase 앱 초기화 완료");
      
      // Initialize Analytics if available
      if (typeof firebase.analytics === 'function') {
        firebase.analytics();
        console.log("✅ Firebase Analytics 초기화 완료");
      }
      
      // Test Firestore availability
      if (typeof firebase.firestore === 'function') {
        const db = firebase.firestore();
        
        // Firestore 오프라인 지속성 비활성화 (오프라인 오류 방지)
        try {
          db.disableNetwork().then(() => {
            console.log("Firestore 네트워크 비활성화 완료");
            return db.enableNetwork();
          }).then(() => {
            console.log("✅ Firestore 네트워크 재연결 완료");
          }).catch((error) => {
            console.warn("⚠️ Firestore 네트워크 설정 실패:", error);
          });
        } catch (error) {
          console.warn("⚠️ Firestore 네트워크 재설정 실패:", error);
        }
        
        console.log("✅ Firebase Firestore 사용 가능");
      } else {
        console.warn("⚠️ Firebase Firestore SDK가 로드되지 않음");
      }
      
      // Test Auth availability
      if (typeof firebase.auth === 'function') {
        const auth = firebase.auth();
        console.log("✅ Firebase Auth 사용 가능");
      } else {
        console.warn("⚠️ Firebase Auth SDK가 로드되지 않음");
      }
      
      // Test Storage availability
      if (typeof firebase.storage === 'function') {
        const storage = firebase.storage();
        console.log("✅ Firebase Storage 사용 가능");
      } else {
        console.warn("⚠️ Firebase Storage SDK가 로드되지 않음");
      }
      
    } catch (error) {
      console.error("❌ Firebase 초기화 오류:", error);
    }
  } else {
    console.log("✅ Firebase 이미 초기화됨");
  }
} else {
  console.error("❌ Firebase SDK가 로드되지 않음 - CDN 링크를 확인하세요");
}

console.log("firebase-config.js 로드 완료");

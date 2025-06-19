const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Firestore 연결 확인 로그
if (db && typeof db.collection === "function") {
  console.log("Firestore 연결 성공");
} else {
  console.log("Firestore 연결 실패");
}

module.exports = { db, admin };
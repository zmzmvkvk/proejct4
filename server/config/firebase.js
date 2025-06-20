const admin = require("firebase-admin");
const path = require("path");
const logger = require("./logger");

let db = null;
let firebaseAdmin = null;

// Firebase 초기화
const initializeFirebase = () => {
  try {
    // 서비스 계정 키 파일 경로
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(__dirname, "../firebase-service-account-key.json");

    // 서비스 계정 키 파일 존재 확인
    const fs = require("fs");
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Firebase service account key file not found: ${serviceAccountPath}`
      );
    }

    const serviceAccount = require(serviceAccountPath);

    // Firebase Admin 초기화
    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      logger.info("Firebase Admin initialized successfully", {
        projectId: serviceAccount.project_id,
      });
    } else {
      firebaseAdmin = admin.app();
      logger.info("Firebase Admin already initialized");
    }

    // Firestore 인스턴스 가져오기
    db = admin.firestore();

    // Firestore 연결 테스트
    return testFirestoreConnection();
  } catch (error) {
    logger.error("Firebase initialization failed", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Firestore 연결 테스트
const testFirestoreConnection = async () => {
  try {
    // 간단한 읽기 작업으로 연결 테스트
    await db.collection("_test").limit(1).get();
    logger.info("Firestore connection test successful");
    return true;
  } catch (error) {
    logger.error("Firestore connection test failed", {
      error: error.message,
    });
    throw error;
  }
};

// Firebase 연결 상태 확인
const isFirebaseConnected = () => {
  return db !== null && firebaseAdmin !== null;
};

// 안전한 Firestore 작업 실행
const safeFirestoreOperation = async (
  operation,
  operationName = "Firestore operation"
) => {
  try {
    if (!isFirebaseConnected()) {
      throw new Error("Firebase is not initialized");
    }

    const result = await operation(db);
    logger.debug(`${operationName} completed successfully`);
    return result;
  } catch (error) {
    logger.error(`${operationName} failed`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  isFirebaseConnected,
  safeFirestoreOperation,
  get db() {
    if (!db) {
      throw new Error(
        "Firebase is not initialized. Call initializeFirebase() first."
      );
    }
    return db;
  },
  get admin() {
    if (!firebaseAdmin) {
      throw new Error(
        "Firebase Admin is not initialized. Call initializeFirebase() first."
      );
    }
    return firebaseAdmin;
  },
};

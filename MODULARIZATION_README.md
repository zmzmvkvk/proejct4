# 🎬 AI 스토리 애니메이션 툴 - 완전 모듈화 및 안정화 v2.0

## 🚀 모듈화 개요

이 프로젝트는 **Zustand**를 이용한 상태관리와 **Express.js 라우터 분리**를 통해 깔끔하게 모듈화되었으며,
**Winston 로깅**, **Helmet 보안**, **Rate Limiting**, **에러 바운더리**, **토스트 알림** 등
프로덕션 레벨의 기능들이 추가되었습니다.

---

## 📁 서버 구조 (Backend) v2.0

```
server/
├── index.js                 # 메인 서버 파일 (완전히 재구성된 안정화 버전)
├── config/
│   ├── firebase.js          # Firebase 초기화 및 연결 관리 (에러 처리 강화)
│   └── logger.js            # Winston 로깅 시스템 (NEW)
├── middleware/
│   └── index.js             # 통합 미들웨어 (CORS, Rate Limiting, 에러 처리) (NEW)
├── services/                # 비즈니스 로직 서비스
│   ├── leonardoService.js   # Leonardo AI API 서비스
│   ├── openaiService.js     # OpenAI API 서비스
│   └── firestoreService.js  # Firestore 데이터베이스 서비스
├── routes/                  # API 라우터들 (모두 개선됨)
│   ├── leonardo.js          # Leonardo AI 관련 라우트 (검증 및 로깅 추가)
│   ├── openai.js            # OpenAI 관련 라우트 (검증 및 로깅 추가)
│   ├── projects.js          # 프로젝트 관련 라우트 (CRUD 완성)
│   └── assets.js            # 에셋 관련 라우트 (검증 및 로깅 추가)
├── logs/                    # 로그 파일 저장소 (NEW)
├── .env.example             # 환경 변수 예시 파일 (NEW)
└── package.json             # 업데이트된 의존성 및 스크립트
```

### 🔧 서버 주요 개선사항 v2.0

- **🛡️ 보안 강화**: Helmet, CORS, Rate Limiting 적용
- **📊 로깅 시스템**: Winston을 이용한 구조화된 로깅
- **🔍 에러 처리**: 통합 에러 핸들링 및 상세한 에러 정보
- **✅ 입력 검증**: 모든 API 엔드포인트에 입력 검증 추가
- **🚀 성능 최적화**: 응답 시간 측정 및 최적화
- **🔄 Graceful Shutdown**: 안전한 서버 종료 처리
- **📈 상태 확인**: Health check 엔드포인트 추가

---

## 📁 클라이언트 구조 (Frontend) v2.0

```
client/src/
├── App.jsx                  # 메인 앱 컴포넌트 (에러 바운더리 및 토스트 시스템 추가)
├── components/              # UI 컴포넌트들
│   ├── ErrorBoundary.jsx    # 에러 바운더리 컴포넌트 (NEW)
│   ├── ProjectSelectionPage.jsx  # 프로젝트 선택 페이지 (완전 재구성)
│   ├── ProjectDetail.jsx    # 프로젝트 상세 페이지 (완전 재구성)
│   └── ... (기타 컴포넌트들)
├── services/                # API 서비스 레이어 (완전 재구성)
│   ├── assetApi.js          # 에셋 관련 API (에러 처리 및 검증 강화)
│   ├── projectApi.js        # 프로젝트 관련 API (CRUD 완성)
│   └── openaiApi.js         # OpenAI 관련 API
├── stores/                  # Zustand 상태 관리
│   ├── index.js             # 모든 스토어 통합 export
│   ├── projectStore.js      # 프로젝트 상태 관리
│   ├── assetStore.js        # 에셋 상태 관리
│   ├── storyStore.js        # 스토리 및 캐릭터 상태 관리
│   └── uiStore.js           # UI 상태 관리 (모달, 에러, 알림 등)
├── utils/                   # 유틸리티 함수들 (NEW)
│   └── toast.js             # 토스트 알림 시스템 (NEW)
├── hooks/                   # 커스텀 훅들
│   └── useDebounce.js       # 디바운스 훅
├── .env                     # 환경 변수 파일 (NEW)
└── package.json             # 업데이트된 의존성 및 스크립트
```

### 🎨 클라이언트 주요 개선사항 v2.0

- **🛡️ 에러 바운더리**: React Error Boundary로 예외 처리
- **🔔 토스트 시스템**: React Hot Toast를 이용한 알림 시스템
- **🔄 API 개선**: Axios 인터셉터와 에러 처리 강화
- **⚡ 성능 최적화**: React Query 설정 최적화
- **🎯 타입 안전성**: TypeScript 지원 추가
- **📱 반응형 UI**: 모바일 친화적인 인터페이스
- **🎨 UX 개선**: 로딩 상태, 에러 상태 시각화

---

## 🔧 설치 및 실행

### 전제 조건

- Node.js 18.0.0 이상
- npm 또는 yarn
- Firebase 프로젝트 설정
- Leonardo AI API 키
- OpenAI API 키

### 1. 환경 설정

#### 서버 환경 변수 설정

```bash
cd server
cp .env.example .env
```

`.env` 파일 편집:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Leonardo AI Configuration
LEONARDO_API_KEY=your_leonardo_api_key_here
LEONARDO_BASE_URL=https://cloud.leonardo.ai/api/rest/v1

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account-key.json

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging Configuration
LOG_LEVEL=info
```

#### 클라이언트 환경 변수 설정

```bash
cd client
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
```

### 2. 의존성 설치

#### 서버 의존성 설치

```bash
cd server
npm install
```

#### 클라이언트 의존성 설치

```bash
cd client
npm install
```

### 3. Firebase 설정

1. Firebase Console에서 서비스 계정 키 생성
2. `firebase-service-account-key.json` 파일을 `server/` 디렉토리에 저장

### 4. 애플리케이션 실행

#### 서버 실행

```bash
cd server
npm start        # 프로덕션 모드
# 또는
npm run dev      # 개발 모드 (nodemon)
```

#### 클라이언트 실행 (별도 터미널)

```bash
cd client
npm run dev      # 개발 모드
# 또는
npm start        # 개발 모드 (alias)
```

---

## 📊 API 엔드포인트

### 🔍 상태 확인

- `GET /api/ping` - 서버 상태 확인
- `GET /api/health` - 전체 서비스 상태 확인
- `GET /api/leonardo/health` - Leonardo AI 서비스 상태
- `GET /api/openai/health` - OpenAI 서비스 상태

### 📁 프로젝트 관리

- `GET /api/projects` - 프로젝트 목록 조회
- `GET /api/projects/:id` - 특정 프로젝트 조회
- `POST /api/projects` - 프로젝트 생성
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제
- `GET /api/projects/:id/stats` - 프로젝트 통계

### 🎯 에셋 관리

- `GET /api/assets` - 전역 에셋 목록 조회
- `POST /api/assets/:id/toggle-favorite` - 에셋 즐겨찾기 토글
- `GET /api/projects/:projectId/assets` - 프로젝트별 에셋 조회
- `POST /api/projects/:projectId/assets` - 프로젝트 에셋 생성

### 🎨 Leonardo AI

- `POST /api/leonardo/generate-image` - 이미지 생성
- `POST /api/leonardo/upload-reference-image` - 참조 이미지 업로드
- `POST /api/leonardo/upload-training-image/:datasetId` - 훈련 이미지 업로드
- `GET /api/leonardo/list-elements` - 사용자 엘리먼트 목록
- `POST /api/leonardo/create-dataset` - 데이터셋 생성
- `POST /api/leonardo/train-element` - 엘리먼트 훈련
- `DELETE /api/leonardo/delete-element/:id` - 엘리먼트 삭제

### 🤖 OpenAI

- `POST /api/openai/enhance-prompt` - 프롬프트 강화
- `POST /api/openai/vision-caption` - 이미지 캡션 생성
- `POST /api/openai/gpt-description` - GPT 설명 생성

---

## 🛠️ 개발 도구 및 스크립트

### 서버 스크립트

```bash
npm start          # 프로덕션 모드 실행
npm run dev        # 개발 모드 실행 (nodemon)
npm run lint       # ESLint 실행
npm run format     # Prettier 실행
```

### 클라이언트 스크립트

```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 미리보기
npm run lint       # ESLint 실행 (자동 수정)
npm run type-check # TypeScript 타입 체크
npm run clean      # 캐시 및 빌드 파일 정리
```

---

## 🔒 보안 기능

### 서버 보안

- **Helmet**: HTTP 헤더 보안 설정
- **CORS**: Cross-Origin Resource Sharing 설정
- **Rate Limiting**: API 요청 제한 (15분당 100회)
- **입력 검증**: 모든 API 엔드포인트 입력 검증
- **에러 정보 제한**: 프로덕션에서 민감한 정보 숨김

### 클라이언트 보안

- **환경 변수**: 민감한 정보 환경 변수로 관리
- **에러 바운더리**: 예외 상황 안전 처리
- **타입 안전성**: TypeScript 지원으로 런타임 에러 방지

---

## 📈 모니터링 및 로깅

### 로깅 시스템

- **Winston**: 구조화된 로깅
- **로그 레벨**: error, warn, info, debug
- **로그 파일**: 자동 로테이션 (5MB, 5개 파일)
- **개발/운영 모드**: 환경별 다른 로깅 설정

### 모니터링

- **요청 로깅**: 모든 HTTP 요청 로깅
- **응답 시간**: 각 API 호출 시간 측정
- **에러 추적**: 상세한 에러 정보 로깅
- **상태 확인**: Health check 엔드포인트

---

## 🚀 배포 가이드

### 환경 변수 설정

1. 프로덕션 환경 변수 설정
2. Firebase 서비스 계정 키 업로드
3. API 키 설정 확인

### 빌드 및 배포

```bash
# 클라이언트 빌드
cd client
npm run build

# 서버 실행
cd server
NODE_ENV=production npm start
```

---

## 🎯 주요 개선사항 요약

### ✅ 완료된 개선사항

1. **서버 안정화**

   - Winston 로깅 시스템 구축
   - Helmet 보안 미들웨어 적용
   - Rate Limiting 구현
   - 입력 검증 강화
   - 에러 처리 개선
   - Graceful Shutdown 구현

2. **클라이언트 안정화**

   - React Error Boundary 추가
   - React Hot Toast 알림 시스템
   - API 서비스 레이어 개선
   - 타입 안전성 강화
   - UX/UI 개선

3. **통합 개선**
   - 환경 변수 관리 개선
   - API 응답 구조 표준화
   - 에러 메시지 한국어화
   - 성능 최적화
   - 코드 품질 개선

### 🔄 지속적 개선 가능 영역

1. **테스트 코드 추가**
2. **CI/CD 파이프라인 구축**
3. **모니터링 대시보드**
4. **캐싱 시스템**
5. **데이터베이스 최적화**

---

## 📞 지원 및 문의

프로젝트 관련 문의사항이나 버그 리포트는 이슈 트래커를 통해 제출해주세요.

**버전**: v2.0.0-stable  
**최종 업데이트**: 2024년 12월  
**라이선스**: MIT

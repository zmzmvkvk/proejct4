# AI 스토리 애니메이션 툴

이 프로젝트는 사용자가 텍스트 스토리를 입력하면, 인공지능(AI)을 활용하여 각 장면의 이미지를 생성하고 스토리보드 형태로 시각화해주는 툴입니다. 복잡한 AI 기술을 직관적으로 제어하며, 아이디어를 체계적으로 시각화하고 발전시킬 수 있도록 돕습니다.

## 기능

- **스토리 작성:** '---' 구분자를 사용하여 여러 장면으로 구성된 스토리를 작성합니다.
- **캐릭터 관리:** 이야기에 등장할 캐릭터의 이름과 참조 이미지 URL을 등록하여 이미지 생성 시 AI가 캐릭터를 참조하도록 합니다.
- **AI 프롬프트 강화:** OpenAI (ChatGPT) API를 사용하여 사용자가 작성한 장면 설명을 기반으로 더욱 상세하고 예술적인 이미지 생성 프롬프트 및 네거티브 프롬프트를 자동으로 생성합니다.
- **AI 이미지 생성:** Leonardo.ai API를 통해 강화된 프롬프트와 참조 이미지를 바탕으로 각 장면의 3D 애니메이션 스타일 이미지를 생성합니다.
- **스토리보드 뷰어:** 생성된 이미지를 스토리 순서대로 시각적으로 확인하고, 개별 장면의 이미지를 필요에 따라 다시 생성할 수 있습니다.
- **오류 처리:** API 키 문제나 네트워크 문제 발생 시 사용자에게 명확한 오류 메시지를 제공합니다.

## 사전 요구 사항

- [Node.js](https://nodejs.org/ko/) (버전 18 이상 권장)
- npm 또는 yarn (Node.js 설치 시 함께 설치됩니다)
- Leonardo.ai API 키
- OpenAI API 키

## 설치 방법

1.  이 저장소를 클론합니다:

    ```bash
    git clone [프로젝트_저장소_URL]
    cd [프로젝트_폴더_이름]
    ```

2.  **서버 의존성 설치:**

    ```bash
    cd server
    npm install
    # 또는 yarn install
    ```

3.  **클라이언트 의존성 설치:**
    ```bash
    cd ../client
    npm install
    # 또는 yarn install
    ```

## 환경 설정

프로젝트 루트 디렉토리 (`project4/`)에 `.env` 파일을 생성하고, 다음 형식으로 API 키를 입력합니다:

```
# .env 파일 예시 (프로젝트 루트에 생성)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
LEONARDO_API_KEY=YOUR_LEONARDO_API_KEY
```

- `YOUR_OPENAI_API_KEY`: [OpenAI 웹사이트](https://platform.openai.com/account/api-keys)에서 발급받은 API 키를 입력합니다.
- `YOUR_LEONARDO_API_KEY`: [Leonardo.ai 웹사이트](https://app.leonardo.ai/settings/api-keys)에서 발급받은 API 키를 입력합니다.

## 애플리케이션 실행

`client`와 `server`를 별도의 터미널에서 각각 실행해야 합니다.

1.  **서버 실행 (첫 번째 터미널):**

    ```bash
    cd server
    npm start
    # 또는 yarn start
    ```

    서버가 성공적으로 실행되면 `Server is running on port 3000` 메시지가 표시됩니다.

2.  **클라이언트 실행 (두 번째 터미널):**
    ```bash
    cd client
    npm start
    # 또는 yarn start
    ```
    클라이언트가 성공적으로 실행되면 웹 브라우저가 자동으로 열리거나 `http://localhost:5173` (또는 다른 포트)로 접속할 수 있습니다.

## 프로젝트 구조

```
project4/
├── client/           # React 기반의 프론트엔드 코드
│   ├── public/
│   │   ├── components/ # 재사용 가능한 UI 컴포넌트
│   │   ├── App.jsx     # 메인 애플리케이션 컴포넌트
│   │   └── main.jsx    # React 앱 진입점
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/           # Node.js Express 기반의 백엔드 API
│   ├── index.js      # 서버 메인 로직 (API 엔드포인트)
│   ├── package.json
│   └── node_modules/
├── .env              # API 키 및 환경 변수 (프로젝트 루트)
├── README.md         # 프로젝트 설명 및 가이드 (현재 파일)
└── requirement.md    # 프로젝트 요구사항 및 예시 코드 (참고용)
```

## 문제 해결 (Troubleshooting)

- **API 키 오류 (401 Unauthorized 또는 403 Forbidden):**
  - `.env` 파일에 API 키가 올바르게 입력되었는지 확인하세요. (오타, 공백 등)
  - API 키가 만료되거나 제한되지 않았는지 각 서비스(OpenAI, Leonardo.ai) 웹사이트에서 확인하세요.
- **서버 연결 오류 (500 Internal Server Error):**
  - 서버가 정상적으로 실행 중인지 확인하세요. (첫 번째 터미널에서 `npm start` 확인)
  - 서버 터미널에 출력된 오류 메시지를 확인하여 자세한 원인을 파악하세요. (예: `Endpoint not found`는 API 경로 문제, `Prompt is empty`는 프롬프트 전달 문제)
- **프롬프트 또는 이미지 생성 실패:**
  - OpenAI 또는 Leonardo.ai API의 일시적인 문제일 수 있습니다. 잠시 후 다시 시도해보세요.
  - API 사용량 제한에 도달했는지 각 서비스 대시보드에서 확인하세요.
- **이미지가 페이지에 표시되지 않음:**
  - 브라우저 개발자 도구 (Console 탭)에서 오류 메시지(`Failed to load resource`)나 `Generated Image URL from server:` 로그를 확인하세요. `imageUrl`이 유효한지 확인하고, 해당 URL에 직접 접속하여 이미지가 존재하는지 확인해보세요.
  - 캐릭터 참조 이미지 URL이 유효하고 접근 가능한지 확인하세요.

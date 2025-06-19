# AI 스토리 애니메이션 툴 - 모듈화 구조

## 🚀 모듈화 개요

이 프로젝트는 **Zustand**를 이용한 상태관리와 **Express.js 라우터 분리**를 통해 깔끔하게 모듈화되었습니다.

---

## 📁 서버 구조 (Backend)

```
server/
├── index.js                 # 메인 서버 파일 (모듈화된 라우터 통합)
├── config/
│   └── firebase.js          # Firebase 초기화 설정
├── services/                # 비즈니스 로직 서비스
│   ├── leonardoService.js   # Leonardo AI API 서비스
│   ├── openaiService.js     # OpenAI API 서비스
│   └── firestoreService.js  # Firestore 데이터베이스 서비스
├── routes/                  # API 라우터들
│   ├── leonardo.js          # Leonardo AI 관련 라우트
│   ├── openai.js            # OpenAI 관련 라우트
│   ├── projects.js          # 프로젝트 관련 라우트
│   └── assets.js            # 에셋 관련 라우트
└── middleware/              # 커스텀 미들웨어 (확장 가능)
```

### 서버 주요 특징

- **라우터 분리**: 기능별로 독립적인 라우터 파일
- **서비스 계층**: API 호출과 비즈니스 로직을 분리
- **설정 분리**: Firebase 등 설정을 별도 파일로 관리
- **API 호환성**: 기존 클라이언트 코드와 호환되도록 엔드포인트 유지

---

## 📁 클라이언트 구조 (Frontend)

```
client/src/
├── App.jsx                  # 메인 앱 컴포넌트
├── stores/                  # Zustand 상태 관리
│   ├── index.js             # 모든 스토어 통합 export
│   ├── projectStore.js      # 프로젝트 상태 관리
│   ├── assetStore.js        # 에셋 상태 관리
│   ├── storyStore.js        # 스토리 및 캐릭터 상태 관리
│   └── uiStore.js           # UI 상태 관리 (모달, 에러, 알림 등)
├── services/                # API 호출 서비스
│   ├── projectApi.js        # 프로젝트 관련 API
│   ├── assetApi.js          # 에셋 관련 API
│   └── openaiApi.js         # OpenAI 관련 API
├── components/              # React 컴포넌트들
│   ├── ProjectSelectionPage.jsx
│   ├── ProjectDetail.jsx
│   ├── AssetSelectionCard.jsx
│   ├── CharacterManager.jsx
│   ├── StoryboardViewer.jsx
│   └── ...
├── hooks/                   # 커스텀 훅
└── utils/                   # 유틸리티 함수들
```

### 클라이언트 주요 특징

- **Zustand 상태관리**: 간단하고 직관적인 상태 관리
- **Immer 미들웨어**: 불변성을 쉽게 관리
- **Persist 미들웨어**: 브라우저 새로고침 시에도 상태 유지
- **DevTools 지원**: Redux DevTools로 상태 디버깅 가능
- **API 서비스 분리**: 각 도메인별로 API 호출 로직 분리

---

## 🔥 Zustand 스토어별 역할

### 1. **ProjectStore** (`projectStore.js`)
```javascript
// 프로젝트 관련 상태와 액션
const { projects, currentProject, fetchProjects, createProject } = useProjectStore();
```
- 프로젝트 목록 관리
- 현재 선택된 프로젝트 상태
- 프로젝트 생성/삭제 액션

### 2. **AssetStore** (`assetStore.js`)
```javascript
// 에셋 관련 상태와 액션
const { assets, selectedAssets, generateImage, toggleFavorite } = useAssetStore();
```
- 전역 에셋 및 프로젝트별 에셋 관리
- 에셋 필터링 (카테고리, 즐겨찾기, 검색)
- 이미지 생성 및 좋아요/즐겨찾기 토글

### 3. **StoryStore** (`storyStore.js`)
```javascript
// 스토리 및 캐릭터 관련 상태와 액션
const { story, scenes, characters, generateScene } = useStoryStore();
```
- 스토리 텍스트 및 장면 관리
- 캐릭터 생성/수정/삭제
- AI 이미지 생성 워크플로우

### 4. **UIStore** (`uiStore.js`)
```javascript
// UI 상태 관리
const { openModal, showError, addNotification } = useUIStore();
```
- 모달 상태 관리
- 에러 및 알림 처리
- 로딩 상태 관리
- 테마 및 레이아웃 상태

---

## 🎯 사용법 예시

### 컴포넌트에서 스토어 사용하기

```jsx
import { useProjectStore, useUIStore } from '../stores';

function ProjectList() {
  const { projects, loading, fetchProjects } = useProjectStore();
  const { showSuccessNotification } = useUIStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (name) => {
    try {
      await createProject(name);
      showSuccessNotification('프로젝트가 생성되었습니다!');
    } catch (error) {
      showErrorNotification(error.message);
    }
  };

  return (
    <div>
      {loading.fetchProjects ? (
        <LoadingSpinner />
      ) : (
        projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))
      )}
    </div>
  );
}
```

### 편리한 액션 훅 사용하기

```jsx
import { useProjectActions, useUIActions } from '../stores';

function ProjectManager() {
  const { createProject, deleteProject } = useProjectActions();
  const { showConfirmation } = useUIActions();

  const handleDelete = (projectId) => {
    showConfirmation({
      title: '프로젝트 삭제',
      message: '정말로 삭제하시겠습니까?',
      onConfirm: () => deleteProject(projectId),
      type: 'danger'
    });
  };

  return (
    // JSX...
  );
}
```

---

## 🔧 API 서비스 활용

### API 서비스 호출 예시

```javascript
import * as projectApi from '../services/projectApi';
import * as assetApi from '../services/assetApi';

// 프로젝트 생성
const newProject = await projectApi.createProject('새 프로젝트');

// 이미지 생성
const result = await assetApi.generateImage({
  storyText: '사이버펑크 도시',
  characterName: '엘라라',
  triggerWord: 'elara_character'
});
```

---

## 🎨 UI 옵션 설정 (카드 형태)

요구사항에 따라 **드롭다운이나 셀렉트가 아닌 카드 형태**로 UI 옵션을 구현할 예정입니다:

```jsx
// 카테고리 선택 카드 예시
const CategoryCard = ({ category, isSelected, onSelect }) => (
  <div 
    className={`card ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(category)}
  >
    <Icon name={category.icon} />
    <span>{category.name}</span>
  </div>
);
```

---

## 🚀 개발 및 실행

### 서버 실행
```bash
cd server
npm install
npm start
```

### 클라이언트 실행
```bash
cd client
npm install
npm run dev
```

---

## 🎉 모듈화의 장점

1. **유지보수성**: 기능별로 분리되어 코드 수정이 용이
2. **확장성**: 새로운 기능 추가가 간단
3. **테스트 용이성**: 각 모듈을 독립적으로 테스트 가능
4. **재사용성**: 서비스와 스토어를 다른 컴포넌트에서 재사용
5. **협업**: 팀원들이 각자 다른 모듈을 담당하여 개발 가능

---

## 📚 다음 단계

1. **컴포넌트 리팩토링**: 기존 컴포넌트들을 새로운 스토어와 연결
2. **에러 바운더리**: React Error Boundary 추가
3. **성능 최적화**: React.memo, useMemo, useCallback 적용
4. **테스트 코드**: Jest 및 React Testing Library로 테스트 작성
5. **타입스크립트**: 점진적으로 TypeScript 도입

모듈화가 완료되어 이제 더 체계적이고 확장 가능한 개발이 가능합니다! 🎯
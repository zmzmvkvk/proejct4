import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import * as openaiApi from "../services/openaiApi";

const useStoryStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        story: "",
        scenes: [],
        characters: [],
        generatingScene: null,
        loading: {
          enhancePrompt: false,
          generateScene: false,
        },
        error: null,

        // Computed
        get sceneDescriptions() {
          const { story } = get();
          return story
            .split("---")
            .map((s) => s.trim())
            .filter(Boolean);
        },

        // Actions
        setStory: (story) => {
          set((state) => {
            state.story = story;
            // 스토리가 변경될 때 장면 목록을 업데이트
            const sceneDescriptions = story
              .split("---")
              .map((s) => s.trim())
              .filter(Boolean);
            state.scenes = sceneDescriptions.map((desc, index) => {
              const existingScene = state.scenes[index];
              return {
                description: desc,
                imageUrl: existingScene?.imageUrl || null,
                prompt: existingScene?.prompt || null,
              };
            });
          });
        },

        addCharacter: (character) => {
          set((state) => {
            const newCharacter = {
              id: Date.now(),
              name: character.name,
              referenceImage: character.referenceImage,
              description:
                character.description || `A character named ${character.name}`,
              ...character,
            };
            state.characters.push(newCharacter);
          });
        },

        updateCharacter: (id, updates) => {
          set((state) => {
            const characterIndex = state.characters.findIndex(
              (c) => c.id === id
            );
            if (characterIndex !== -1) {
              state.characters[characterIndex] = {
                ...state.characters[characterIndex],
                ...updates,
              };
            }
          });
        },

        deleteCharacter: (id) => {
          set((state) => {
            state.characters = state.characters.filter((c) => c.id !== id);
          });
        },

        generateScene: async (sceneIndex, selectedAsset) => {
          set((state) => {
            state.generatingScene = sceneIndex;
            state.loading.generateScene = true;
            state.error = null;
          });

          try {
            const { scenes, characters } = get();
            const sceneDescription = scenes[sceneIndex].description;

            // 장면에 언급된 캐릭터 찾기
            const mentionedCharacter = characters.find((char) =>
              sceneDescription.includes(char.name)
            );

            // 프롬프트 강화
            const enhancedPrompt = await openaiApi.enhancePrompt(
              sceneDescription,
              mentionedCharacter
            );

            // 이미지 생성 페이로드 구성
            const payload = {
              storyText: enhancedPrompt.prompt,
              characterName: mentionedCharacter?.name,
              triggerWord: selectedAsset?.triggerWord,
              assetId: selectedAsset?.id,
            };

            // Leonardo AI로 이미지 생성 (이 부분은 assetStore에서 처리)
            const result = await fetch("/api/leonardo/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!result.ok) {
              throw new Error("이미지 생성에 실패했습니다.");
            }

            const data = await result.json();

            set((state) => {
              state.scenes[sceneIndex].imageUrl = data.imageUrl;
              state.scenes[sceneIndex].prompt = data.prompt;
              state.generatingScene = null;
              state.loading.generateScene = false;
            });

            return data;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.generatingScene = null;
              state.loading.generateScene = false;
            });
            throw error;
          }
        },

        enhancePrompt: async (sceneDescription, character) => {
          set((state) => {
            state.loading.enhancePrompt = true;
            state.error = null;
          });

          try {
            const result = await openaiApi.enhancePrompt(
              sceneDescription,
              character
            );
            set((state) => {
              state.loading.enhancePrompt = false;
            });
            return result;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.enhancePrompt = false;
            });
            throw error;
          }
        },

        updateSceneImage: (sceneIndex, imageUrl, prompt = null) => {
          set((state) => {
            if (state.scenes[sceneIndex]) {
              state.scenes[sceneIndex].imageUrl = imageUrl;
              if (prompt) {
                state.scenes[sceneIndex].prompt = prompt;
              }
            }
          });
        },

        clearSceneImage: (sceneIndex) => {
          set((state) => {
            if (state.scenes[sceneIndex]) {
              state.scenes[sceneIndex].imageUrl = null;
              state.scenes[sceneIndex].prompt = null;
            }
          });
        },

        loadExampleStory: () => {
          const exampleStory = `SCENE 1
주인공 엘라라가 네온 불빛이 가득한 사이버펑크 도시의 뒷골목으로 들어선다. 비가 내리고 바닥은 젖어있다.

---

SCENE 2
엘라라는 거대한 감시 드론을 발견하고, 재빨리 그림자 속으로 몸을 숨긴다. 긴장감이 흐른다.

---

SCENE 3
드론이 지나간 후, 엘라라는 비밀스러운 문에 다가가 홀로그램 잠금장치를 해제하려고 시도한다.`;

          set((state) => {
            state.story = exampleStory;
            state.setStory(exampleStory);
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        reset: () => {
          set((state) => {
            state.story = "";
            state.scenes = [];
            state.characters = [];
            state.generatingScene = null;
            state.loading = {
              enhancePrompt: false,
              generateScene: false,
            };
            state.error = null;
          });
        },
      })),
      {
        name: "story-store",
        partialize: (state) => ({
          story: state.story,
          characters: state.characters,
          scenes: state.scenes,
        }),
      }
    ),
    { name: "StoryStore" }
  )
);

export default useStoryStore;

// Zustand Stores
export { default as useProjectStore } from "./projectStore";
export { default as useAssetStore } from "./assetStore";
export { default as useStoryStore } from "./storyStore";
export { default as useUIStore } from "./uiStore";

// Combined hooks for convenience
export const useStores = () => {
  const projectStore = useProjectStore();
  const assetStore = useAssetStore();
  const storyStore = useStoryStore();
  const uiStore = useUIStore();

  return {
    projectStore,
    assetStore,
    storyStore,
    uiStore,
  };
};

// Selectors for common operations
export const useProjectActions = () =>
  useProjectStore((state) => ({
    fetchProjects: state.fetchProjects,
    createProject: state.createProject,
    deleteProject: state.deleteProject,
    setCurrentProject: state.setCurrentProject,
  }));

export const useAssetActions = () =>
  useAssetStore((state) => ({
    fetchAssets: state.fetchAssets,
    fetchProjectAssets: state.fetchProjectAssets,
    generateImage: state.generateImage,
    toggleFavorite: state.toggleFavorite,
    selectAsset: state.selectAsset,
    setFilter: state.setFilter,
  }));

export const useStoryActions = () =>
  useStoryStore((state) => ({
    setStory: state.setStory,
    addCharacter: state.addCharacter,
    updateCharacter: state.updateCharacter,
    deleteCharacter: state.deleteCharacter,
    generateScene: state.generateScene,
    loadExampleStory: state.loadExampleStory,
  }));

export const useUIActions = () =>
  useUIStore((state) => ({
    openModal: state.openModal,
    closeModal: state.closeModal,
    showError: state.showError,
    clearError: state.clearError,
    showConfirmation: state.showConfirmation,
    setGlobalLoading: state.setGlobalLoading,
    toggleSidebar: state.toggleSidebar,
    addNotification: state.addNotification,
  }));

// Combined selectors for loading states
export const useLoadingStates = () => {
  const projectLoading = useProjectStore((state) => state.loading);
  const assetLoading = useAssetStore((state) => state.loading);
  const storyLoading = useStoryStore((state) => state.loading);
  const globalLoading = useUIStore((state) => state.globalLoading);

  return {
    project: projectLoading,
    asset: assetLoading,
    story: storyLoading,
    global: globalLoading,
    isAnyLoading:
      Object.values(projectLoading).some(Boolean) ||
      Object.values(assetLoading).some(Boolean) ||
      Object.values(storyLoading).some(Boolean) ||
      globalLoading,
  };
};

// Combined selectors for error states
export const useErrorStates = () => {
  const projectError = useProjectStore((state) => state.error);
  const assetError = useAssetStore((state) => state.error);
  const storyError = useStoryStore((state) => state.error);
  const uiError = useUIStore((state) => state.error);

  return {
    project: projectError,
    asset: assetError,
    story: storyError,
    ui: uiError,
    hasAnyError: Boolean(
      projectError || assetError || storyError || uiError.message
    ),
  };
};

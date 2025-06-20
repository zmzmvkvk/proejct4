import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import * as assetApi from "../services/assetApi";

const useAssetStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        assets: [],
        projectAssets: [],
        favorites: [],
        selectedAssets: [],
        filters: {
          category: "ALL", // CHARACTER, BACKGROUND, OBJECT, ALL
          favorites: false,
          search: "",
        },
        loading: {
          fetchAssets: false,
          fetchProjectAssets: false,
          generateImage: false,
          toggleFavorite: false,
        },
        error: null,

        // Computed
        get filteredAssets() {
          const { assets, filters } = get();
          return assets.filter((asset) => {
            const matchesCategory =
              filters.category === "ALL" || asset.category === filters.category;
            const matchesFavorites = !filters.favorites || asset.isFavorite;
            const matchesSearch =
              !filters.search ||
              asset.name.toLowerCase().includes(filters.search.toLowerCase()) ||
              asset.triggerWord
                .toLowerCase()
                .includes(filters.search.toLowerCase());

            return matchesCategory && matchesFavorites && matchesSearch;
          });
        },

        // Actions
        fetchAssets: async () => {
          set((state) => {
            state.loading.fetchAssets = true;
            state.error = null;
          });

          try {
            const assets = await assetApi.fetchAssets();
            set((state) => {
              state.assets = assets;
              state.loading.fetchAssets = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.fetchAssets = false;
            });
          }
        },

        fetchProjectAssets: async (projectId) => {
          set((state) => {
            state.loading.fetchProjectAssets = true;
            state.error = null;
          });

          try {
            const assets = await assetApi.fetchProjectAssets(projectId);
            set((state) => {
              state.projectAssets = assets;
              state.loading.fetchProjectAssets = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.fetchProjectAssets = false;
            });
          }
        },

        generateImage: async (payload) => {
          set((state) => {
            state.loading.generateImage = true;
            state.error = null;
          });

          try {
            const result = await assetApi.generateImage(payload);
            set((state) => {
              state.loading.generateImage = false;
            });
            return result;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.generateImage = false;
            });
            throw error;
          }
        },

        toggleFavorite: async (
          assetId,
          isProjectAsset = false,
          projectId = null
        ) => {
          set((state) => {
            state.loading.toggleFavorite = true;
            state.error = null;
          });

          try {
            const result = isProjectAsset
              ? await assetApi.toggleProjectAssetFavorite(projectId, assetId)
              : await assetApi.toggleAssetFavorite(assetId);

            set((state) => {
              if (isProjectAsset) {
                const assetIndex = state.projectAssets.findIndex(
                  (a) => a.id === assetId
                );
                if (assetIndex !== -1) {
                  state.projectAssets[assetIndex].isFavorite =
                    result.asset.isFavorite;
                }
              } else {
                const assetIndex = state.assets.findIndex(
                  (a) => a.id === assetId
                );
                if (assetIndex !== -1) {
                  state.assets[assetIndex].isFavorite = result.asset.isFavorite;
                }
              }
              state.loading.toggleFavorite = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.toggleFavorite = false;
            });
          }
        },

        selectAsset: (asset) => {
          set((state) => {
            const isSelected = state.selectedAssets.find(
              (a) => a.id === asset.id
            );
            if (isSelected) {
              state.selectedAssets = state.selectedAssets.filter(
                (a) => a.id !== asset.id
              );
            } else {
              state.selectedAssets.push(asset);
            }
          });
        },

        clearSelectedAssets: () => {
          set((state) => {
            state.selectedAssets = [];
          });
        },

        setFilter: (key, value) => {
          set((state) => {
            state.filters[key] = value;
          });
        },

        resetFilters: () => {
          set((state) => {
            state.filters = {
              category: "ALL",
              favorites: false,
              search: "",
            };
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        reset: () => {
          set((state) => {
            state.assets = [];
            state.projectAssets = [];
            state.favorites = [];
            state.selectedAssets = [];
            state.filters = {
              category: "ALL",
              favorites: false,
              search: "",
            };
            state.loading = {
              fetchAssets: false,
              fetchProjectAssets: false,
              generateImage: false,
              toggleFavorite: false,
            };
            state.error = null;
          });
        },
      })),
      {
        name: "asset-store",
        partialize: (state) => ({
          assets: state.assets,
          favorites: state.favorites,
          filters: state.filters,
        }),
      }
    ),
    { name: "AssetStore" }
  )
);

export default useAssetStore;

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as projectApi from '../services/projectApi';

const useProjectStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        projects: [],
        currentProject: null,
        loading: {
          fetchProjects: false,
          createProject: false,
          deleteProject: false,
        },
        error: null,

        // Actions
        fetchProjects: async () => {
          set((state) => {
            state.loading.fetchProjects = true;
            state.error = null;
          });

          try {
            const projects = await projectApi.fetchProjects();
            set((state) => {
              state.projects = projects;
              state.loading.fetchProjects = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.fetchProjects = false;
            });
          }
        },

        createProject: async (name) => {
          set((state) => {
            state.loading.createProject = true;
            state.error = null;
          });

          try {
            const newProject = await projectApi.createProject(name);
            set((state) => {
              state.projects.push(newProject);
              state.loading.createProject = false;
            });
            return newProject;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.createProject = false;
            });
            throw error;
          }
        },

        deleteProject: async (id) => {
          set((state) => {
            state.loading.deleteProject = true;
            state.error = null;
          });

          try {
            await projectApi.deleteProject(id);
            set((state) => {
              state.projects = state.projects.filter(p => p.id !== id);
              if (state.currentProject?.id === id) {
                state.currentProject = null;
              }
              state.loading.deleteProject = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.loading.deleteProject = false;
            });
            throw error;
          }
        },

        setCurrentProject: (project) => {
          set((state) => {
            state.currentProject = project;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        reset: () => {
          set((state) => {
            state.projects = [];
            state.currentProject = null;
            state.loading = {
              fetchProjects: false,
              createProject: false,
              deleteProject: false,
            };
            state.error = null;
          });
        },
      })),
      {
        name: 'project-store',
        partialize: (state) => ({
          projects: state.projects,
          currentProject: state.currentProject,
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);

export default useProjectStore;
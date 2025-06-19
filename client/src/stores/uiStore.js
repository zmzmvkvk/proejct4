import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useUIStore = create(
  devtools(
    immer((set, get) => ({
      // Modal States
      modals: {
        settings: false,
        error: false,
        characterForm: false,
        assetTraining: false,
        projectCreate: false,
        confirmation: false,
      },

      // Error Handling
      error: {
        message: null,
        details: null,
        timestamp: null,
      },

      // Confirmation Dialog
      confirmation: {
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        confirmText: '확인',
        cancelText: '취소',
        type: 'info', // info, warning, danger
      },

      // Loading States
      globalLoading: false,
      loadingMessage: '',

      // Sidebar & Layout
      sidebarOpen: true,
      mobileMenuOpen: false,

      // Theme
      theme: 'dark',

      // Notifications
      notifications: [],

      // Actions
      openModal: (modalName) => {
        set((state) => {
          state.modals[modalName] = true;
        });
      },

      closeModal: (modalName) => {
        set((state) => {
          state.modals[modalName] = false;
        });
      },

      closeAllModals: () => {
        set((state) => {
          Object.keys(state.modals).forEach(key => {
            state.modals[key] = false;
          });
        });
      },

      showError: (message, details = null) => {
        set((state) => {
          state.error = {
            message,
            details,
            timestamp: Date.now(),
          };
          state.modals.error = true;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = {
            message: null,
            details: null,
            timestamp: null,
          };
          state.modals.error = false;
        });
      },

      showConfirmation: (config) => {
        set((state) => {
          state.confirmation = {
            title: config.title || '확인',
            message: config.message || '',
            onConfirm: config.onConfirm || null,
            onCancel: config.onCancel || null,
            confirmText: config.confirmText || '확인',
            cancelText: config.cancelText || '취소',
            type: config.type || 'info',
          };
          state.modals.confirmation = true;
        });
      },

      closeConfirmation: () => {
        set((state) => {
          state.modals.confirmation = false;
          state.confirmation = {
            title: '',
            message: '',
            onConfirm: null,
            onCancel: null,
            confirmText: '확인',
            cancelText: '취소',
            type: 'info',
          };
        });
      },

      setGlobalLoading: (loading, message = '') => {
        set((state) => {
          state.globalLoading = loading;
          state.loadingMessage = message;
        });
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },

      setSidebarOpen: (open) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },

      toggleMobileMenu: () => {
        set((state) => {
          state.mobileMenuOpen = !state.mobileMenuOpen;
        });
      },

      setMobileMenuOpen: (open) => {
        set((state) => {
          state.mobileMenuOpen = open;
        });
      },

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },

      addNotification: (notification) => {
        const id = Date.now() + Math.random();
        set((state) => {
          state.notifications.push({
            id,
            type: 'info',
            autoHide: true,
            duration: 5000,
            ...notification,
          });
        });

        // Auto-hide notification
        if (notification.autoHide !== false) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || 5000);
        }

        return id;
      },

      removeNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearAllNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      // Utility Actions
      showSuccessNotification: (message) => {
        get().addNotification({
          type: 'success',
          message,
        });
      },

      showErrorNotification: (message) => {
        get().addNotification({
          type: 'error',
          message,
          duration: 8000,
        });
      },

      showWarningNotification: (message) => {
        get().addNotification({
          type: 'warning',
          message,
        });
      },

      showInfoNotification: (message) => {
        get().addNotification({
          type: 'info',
          message,
        });
      },

      reset: () => {
        set((state) => {
          state.modals = {
            settings: false,
            error: false,
            characterForm: false,
            assetTraining: false,
            projectCreate: false,
            confirmation: false,
          };
          state.error = {
            message: null,
            details: null,
            timestamp: null,
          };
          state.globalLoading = false;
          state.loadingMessage = '';
          state.notifications = [];
        });
      },
    })),
    { name: 'UIStore' }
  )
);

export default useUIStore;
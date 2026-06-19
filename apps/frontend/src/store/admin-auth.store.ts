import { create } from 'zustand';

interface AdminAuthStore {
  originalAdminToken: string | null;
  isImpersonating: boolean;
  setOriginalAdminToken: (token: string | null) => void;
  exitImpersonation: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthStore>((set, get) => ({
  originalAdminToken: typeof window !== 'undefined' ? window.sessionStorage.getItem('original_admin_token') : null,
  isImpersonating: typeof window !== 'undefined' ? !!window.sessionStorage.getItem('original_admin_token') : false,
  
  setOriginalAdminToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        window.sessionStorage.setItem('original_admin_token', token);
      } else {
        window.sessionStorage.removeItem('original_admin_token');
      }
    }
    set({ originalAdminToken: token, isImpersonating: !!token });
  },

  exitImpersonation: async () => {
    const originalToken = get().originalAdminToken;
    if (!originalToken) return;

    const { useAuthStore } = await import('./auth.store');

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('original_admin_token');
    }
    set({ originalAdminToken: null, isImpersonating: false });

    // Force restore original admin token
    useAuthStore.setState({ accessToken: originalToken });
    await useAuthStore.getState().initialize();
  }
}));

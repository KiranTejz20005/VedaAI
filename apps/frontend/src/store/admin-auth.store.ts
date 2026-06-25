import { create } from 'zustand';
import { api } from '@/lib/api';

export interface AvailableOrganization {
  id: string;
  name: string;
  code: string;
  role: string;
  email?: string;
}

interface AdminAuthStore {
  originalAdminToken: string | null;
  isImpersonating: boolean;
  availableOrganizations: AvailableOrganization[];
  activeOrganizationId: string | null;
  setOriginalAdminToken: (token: string | null) => void;
  initializeFromStorage: () => void;
  exitImpersonation: () => Promise<void>;
  fetchAvailableOrganizations: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<boolean>;
  setActiveOrganization: (orgId: string | null) => void;
}

export const useAdminAuthStore = create<AdminAuthStore>((set, get) => ({
  originalAdminToken: null,
  isImpersonating: false,
  availableOrganizations: [],
  activeOrganizationId: null,

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

  initializeFromStorage: () => {
    if (typeof window === 'undefined') return;
    const originalAdminToken = window.sessionStorage.getItem('original_admin_token');
    const activeOrganizationId = window.localStorage.getItem('active_organization_id');
    set({
      originalAdminToken,
      isImpersonating: !!originalAdminToken,
      activeOrganizationId,
    });
  },

  exitImpersonation: async () => {
    const originalToken = get().originalAdminToken;
    if (!originalToken) return;

    const { useAuthStore } = await import('./auth.store');

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('original_admin_token');
    }
    set({ originalAdminToken: null, isImpersonating: false });

    useAuthStore.setState({ accessToken: originalToken });
    await useAuthStore.getState().initialize();
  },

  fetchAvailableOrganizations: async () => {
    try {
      const res = await api.get('/auth/me/organizations');
      if (res.data?.success) {
        const orgs: AvailableOrganization[] = res.data.data;
        set({ availableOrganizations: orgs });
        const stored = get().activeOrganizationId;
        if (!stored && orgs.length > 0) {
          const firstId = orgs[0].id;
          set({ activeOrganizationId: firstId });
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('active_organization_id', firstId);
          }
        }
      }
    } catch {
      // ignore
    }
  },

  switchOrganization: async (orgId) => {
    try {
      const res = await api.post('/auth/me/switch-organization', { organizationId: orgId });
      if (res.data?.success) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('active_organization_id', orgId);
        }
        set({ activeOrganizationId: orgId });
        const { useAuthStore } = await import('./auth.store');
        await useAuthStore.getState().initialize();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  setActiveOrganization: (orgId) => {
    if (typeof window !== 'undefined') {
      if (orgId) {
        window.localStorage.setItem('active_organization_id', orgId);
      } else {
        window.localStorage.removeItem('active_organization_id');
      }
    }
    set({ activeOrganizationId: orgId });
  },
}));

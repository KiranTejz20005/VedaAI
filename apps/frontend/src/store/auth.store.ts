import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  institutionId: string | null;
  institutionName: string | null;
  departmentName: string | null;
  departmentId: string | null;
  forcePasswordReset?: boolean;
  preferences: {
    emailNotifications?: boolean;
    inAppAlerts?: boolean;
    autoSave?: boolean;
    weeklyDigest?: boolean;
    [key: string]: any;
  };
  hasCompletedOnboarding?: boolean;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initialize: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role?: string;
    institutionName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  updateInstitution: (data: { institutionName: string; department: string; academicYear?: string }) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: {
    firstName: string;
    lastName: string;
    institutionName: string;
    department: string;
    className: string;
    subject: string;
    students: Array<{ name: string; rollNo: string; email: string }>;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    try {
      set({ isLoading: true });
      // 1. Try to refresh access token using the HttpOnly refresh cookie
      const refreshRes = await api.post('/auth/refresh');
      const token = refreshRes.data?.data?.accessToken;

      if (token) {
        // Set token temporarily so the /auth/me call below can use it
        set({ accessToken: token });

        // 2. Fetch the profile details
        const meRes = await api.get('/auth/me');
        const user = meRes.data?.data;

        if (user) {
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      }
      get().clearAuth();
      return false;
    } catch (err) {
      get().clearAuth();
      return false;
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data?.data || {};
      if (accessToken && user) {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'Invalid response from auth server.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Login failed.' };
    }
  },

  signup: async (data) => {
    try {
      set({ isLoading: true });
      await api.post('/auth/signup', data);
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Signup failed.' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore failures on logout endpoint and proceed to clear client auth
    } finally {
      get().clearAuth();
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await api.put('/auth/me/profile', data);
      const updatedUser = res.data?.data;
      if (updatedUser) {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Profile update failed.' };
    }
  },

  updateInstitution: async (data) => {
    try {
      const res = await api.put('/auth/me/institution', data);
      if (res.data?.success) {
        // Refresh profile details to get accurate names
        const meRes = await api.get('/auth/me');
        const user = meRes.data?.data;
        if (user) {
          set({ user });
        }
        return { success: true };
      }
      return { success: false, error: 'Failed to update institution settings.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Institution update failed.' };
    }
  },

  completeOnboarding: async (data) => {
    try {
      // 1. Update personal profile name if changed
      await api.put('/auth/me/profile', {
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // 2. Setup institution & department
      await api.put('/auth/me/institution', {
        institutionName: data.institutionName,
        department: data.department,
        academicYear: '2026-2027',
      });

      // 3. Create class group
      const groupRes = await api.post('/groups', {
        name: data.className,
        subject: data.subject,
      });
      const group = groupRes.data?.data;

      // 4. Bulk add students if any were configured
      if (group?.id && data.students.length > 0) {
        await api.post(`/groups/${group.id}/students/bulk`, {
          students: data.students,
        });
      }

      // 5. Update user onboarding status
      await api.post('/auth/onboarding/complete');

      // 6. Refresh user profile
      const meRes = await api.get('/auth/me');
      const user = meRes.data?.data;
      if (user) {
        set({ user });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Onboarding failed.' };
    }
  },
}));

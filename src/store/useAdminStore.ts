import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin } from '@/types';

interface AdminState {
  admin: Admin | null;
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  adminLogin: (admin: Admin, token: string) => void;
  adminLogout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      isAdminAuthenticated: false,
      adminToken: null,
      adminLogin: (admin, token) => set({ admin, adminToken: token, isAdminAuthenticated: true }),
      adminLogout: () => set({ admin: null, adminToken: null, isAdminAuthenticated: false }),
    }),
    {
      name: 'admin-storage',
    }
  )
);

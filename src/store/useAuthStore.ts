import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types';

interface AuthState {
  user: Customer | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: Customer, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<Customer>) => void;
  pendingFavorite: string | null;
  setPendingFavorite: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: (user, token) => {
        // Clear any stale state and set fresh data from DB
        const freshUser = { ...user, favorites: user.favorites || [] };
        set({ 
          user: freshUser, 
          token, 
          isAuthenticated: true 
        });
        // Update localStorage immediately
        setTimeout(() => {
          set(() => ({ user: freshUser }));
        }, 0);
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => {
          const newUser = state.user ? { ...state.user, ...updates } : null;
          if (newUser && !newUser.favorites) newUser.favorites = [];
          return { user: newUser };
        }),
      pendingFavorite: null,
      setPendingFavorite: (id) => set({ pendingFavorite: id }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

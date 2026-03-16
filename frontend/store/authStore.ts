import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/apiClient";

interface User {
  id: number;
  email: string;
  name: string;
  role?: "student" | "instructor" | "admin";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAccessToken: (token: string) => void;
  login: (data: any) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAccessToken: (token: string) => set({ accessToken: token }),
      login: (data) => set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true }),
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        apiClient.post("/auth/logout").catch(() => {});
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

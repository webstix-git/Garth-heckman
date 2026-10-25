"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AdminUser } from "@/types";

type AdminAuthState = {
  user: AdminUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthSessionProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AdminUser | null;
  /** @deprecated ignored — was NextAuth Session */
  session?: unknown;
}) {
  const [user, setUser] = useState<AdminUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/auth", { cache: "no-store" });
    if (!response.ok) return setUser(null);
    const body = await response.json();
    setUser(body.data?.user ?? null);
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh }),
    [user, loading, refresh],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

/** Compatible with previous next-auth `useSession` usage in admin pages. */
export function useSession() {
  const { user, loading, refresh } = useContext(AdminAuthContext);
  return {
    data: user ? { user } : null,
    status: (loading ? "loading" : user ? "authenticated" : "unauthenticated") as
      | "loading"
      | "authenticated"
      | "unauthenticated",
    update: refresh,
  };
}

export function useAdminUser() {
  return useContext(AdminAuthContext);
}

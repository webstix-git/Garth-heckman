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

import { createClient } from "@/lib/supabase/client";
import {
  isAdminUser,
  toAdminUserFromSupabase,
} from "@/lib/admin-auth";
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
    const supabase = createClient();
    const {
      data: { user: next },
    } = await supabase.auth.getUser();
    if (next && isAdminUser(next)) {
      setUser(toAdminUserFromSupabase(next));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    void refresh().finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const next = authSession?.user;
      if (next && isAdminUser(next)) {
        setUser(toAdminUserFromSupabase(next));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

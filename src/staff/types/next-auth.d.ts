import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: string;
    phone?: string | null;
    bio?: string | null;
    rememberMe?: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      phone?: string | null;
      bio?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    phone?: string | null;
    bio?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    phone?: string | null;
    bio?: string | null;
  }
}

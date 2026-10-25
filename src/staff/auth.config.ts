import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Keep the frontend aligned with the backend's shared session variable.
  secret: process.env.AUTH_SESSION_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
} satisfies NextAuthConfig;

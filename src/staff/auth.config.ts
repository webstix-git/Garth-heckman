import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
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

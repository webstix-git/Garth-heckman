"use client";

import type { AuthSession } from "@/types";
import { changePassword, getProfile, updateProfile } from "@/services/auth-actions";

export { changePassword, getProfile, updateProfile };

export async function login(
  email: string,
  password: string,
  _remember = true,
): Promise<AuthSession> {
  void _remember;
  const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, admin: true }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Invalid email or password");
  return body.data as AuthSession;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth", { method: "DELETE" });
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const response = await fetch("/api/auth", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()).data as AuthSession;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, action: "reset" }) });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Unable to send password reset email");
  }
}

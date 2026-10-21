"use client";

import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { useSession } from "@/components/providers/session-provider";
import { FormField } from "@/components/shared/form-field";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { changePassword, getProfile, updateProfile } from "@/services/auth";
import type { AdminUser } from "@/types";

export default function ProfilePage() {
  const { status, update } = useSession();
  const [form, setForm] = useState<AdminUser | null>(null);
  const [loadedEmail, setLoadedEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (!cancelled) {
          setForm(profile);
          setLoadedEmail(profile.email.trim().toLowerCase());
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load profile");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!form?.username.trim()) {
      toast.error("Username is required.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    const previousEmail = loadedEmail;
    setSaving(true);
    try {
      const next = await updateProfile({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim(),
        avatar: form.avatar,
      });
      setForm(next);
      setLoadedEmail(next.email.trim().toLowerCase());
      await update();
      if (next.email.trim().toLowerCase() !== previousEmail) {
        toast.success("Profile saved. Sign in next time with your new email.");
      } else {
        toast.success("Profile saved");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadAvatar(file: File | undefined) {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/store/profile/avatar", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { url?: string; profile?: AdminUser };
        error?: string;
      };
      if (!res.ok || !json.data?.url) {
        throw new Error(json.error || "Photo upload failed");
      }

      const next = json.data.profile ?? {
        ...form!,
        avatar: json.data.url,
      };
      setForm(next);
      await update();
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function onChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!newPassword) {
      toast.error("Enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (status === "loading" || loadingProfile || !form) {
    return <LoadingState label="Loading profile…" />;
  }

  const displayName = form.username || form.email;
  const profileInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin profile"
        description="Your account details for this admin panel."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form className="space-y-6" onSubmit={onSaveProfile}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-5 sm:col-span-2">
                <div
                  className="relative shrink-0 overflow-hidden rounded-full border border-border bg-muted"
                  style={{ width: 128, height: 128 }}
                >
                  {form.avatar ? (
                    // The uploaded profile image belongs to this signed-in admin only.
                    <img
                      src={form.avatar}
                      alt={displayName}
                      className="size-full object-cover"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                      {profileInitials || "A"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{form.username}</p>
                    <p className="text-xs text-muted-foreground">{form.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => void onUploadAvatar(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar || saving}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Camera className="size-4" />
                      )}
                      Change photo
                    </Button>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or WebP up to 5MB.</p>
                  </div>
                </div>
              </div>
              <FormField label="Username" htmlFor="profile-username" required>
                <Input
                  id="profile-username"
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((current) => (current ? { ...current, username: e.target.value } : current))
                  }
                />
              </FormField>
              <FormField label="Email" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => (current ? { ...current, email: e.target.value } : current))
                  }
                />
              </FormField>
              <FormField label="Phone" htmlFor="profile-phone">
                <Input
                  id="profile-phone"
                  type="tel"
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    setForm((current) => (current ? { ...current, phone: e.target.value } : current))
                  }
                />
              </FormField>
              <FormField label="Role" htmlFor="profile-role">
                <Input id="profile-role" value={form.role} disabled />
              </FormField>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving || uploadingAvatar}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <form className="space-y-6" onSubmit={onChangePassword}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Password</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
              <FormField label="New password" htmlFor="new-password">
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirm new password" htmlFor="confirm-password">
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <p className="text-xs text-muted-foreground">
                Password is stored securely for this account.
              </p>
              <Button type="submit" variant="outline" disabled={passwordSaving}>
                {passwordSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Update password
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { login } from "@/services/auth";

interface FieldErrors {
  email?: string;
  password?: string;
}

const BRAND_CACHE_KEY = "gh.admin.store-settings";

const fieldClass =
  "h-11 rounded-lg border border-neutral-300 bg-white text-sm shadow-none md:text-sm dark:border-neutral-300 dark:bg-white dark:text-neutral-900 hover:border-neutral-400 focus-visible:border-neutral-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-neutral-200";

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!email.includes("@")) errors.email = "Enter a valid email.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [emailLocked, setEmailLocked] = useState(true);
  const [passwordLocked, setPasswordLocked] = useState(true);

  // Drop stale brand cache (old "Grath Heckman" logo/name) so it cannot paint after login.
  useEffect(() => {
    try {
      window.localStorage.removeItem(BRAND_CACHE_KEY);
    } catch {
      // ignore
    }
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await login(email, password, remember);
      toast.success("Logged in");
      const rawNext = searchParams.get("next") || "/admin/dashboard";
      const next =
        rawNext.startsWith("/admin") && !rawNext.startsWith("//")
          ? rawNext
          : "/admin/dashboard";
      router.push(next);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full text-neutral-900">
      <div className="border-b border-neutral-200 px-8 py-7">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-sm text-neutral-600">Use your admin email and password.</p>
      </div>
      <form className="grid gap-5 px-8 py-7" onSubmit={onSubmit} noValidate autoComplete="off">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-neutral-800">
            Email:
            <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-[1] size-5 -translate-y-1/2 text-[#333]" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={emailLocked}
              value={email}
              onFocus={() => setEmailLocked(false)}
              required
              aria-required="true"
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
              }}
              className={cn(fieldClass, "pl-11")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email ? (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password" className="text-sm font-medium text-neutral-800">
            Password:
            <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-[1] size-5 -translate-y-1/2 text-[#333]" />
            <PasswordInput
              id="password"
              name="password"
              value={password}
              readOnly={passwordLocked}
              onFocus={() => setPasswordLocked(false)}
              required
              aria-required="true"
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
              autoComplete="current-password"
              className={cn(fieldClass, "pl-11 pr-11")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
          </div>
          {errors.password ? (
            <p id="password-error" className="text-sm text-red-600" role="alert">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2.5 pt-0.5">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked === true)}
            className="size-5 rounded-md border-neutral-300"
          />
          <Label htmlFor="remember" className="text-sm font-normal text-neutral-700">
            Remember me
          </Label>
        </div>

        <Button
          type="submit"
          className="mt-1 h-11 w-full gap-2 rounded-lg text-sm font-medium"
          disabled={loading}
          size="lg"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : null}
          Login
        </Button>
      </form>
    </div>
  );
}

"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  id?: string;
}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        autoComplete="off"
      />
      <button
        type="button"
        className="absolute top-1/2 right-1.5 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#333] hover:bg-neutral-200/70"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

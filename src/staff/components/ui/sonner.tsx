"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-5 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-sky-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-red-500" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        close: <XIcon className="size-3.5" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !pr-8",
          closeButton:
            "!left-auto !right-1.5 !top-1/2 !size-6 !-translate-y-1/2 !translate-x-0 border-0 bg-transparent text-muted-foreground hover:!bg-muted hover:!text-foreground hover:!border-transparent",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

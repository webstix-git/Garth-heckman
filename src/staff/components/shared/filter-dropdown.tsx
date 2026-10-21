"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
  "aria-label"?: string;
}

export function FilterDropdown({
  value,
  onChange,
  options,
  placeholder = "Filter",
  className,
  size = "default",
  "aria-label": ariaLabel,
}: FilterDropdownProps) {
  return (
    <Select
      value={value}
      items={options}
      onValueChange={(next) => {
        if (next != null) onChange(String(next));
      }}
    >
      <SelectTrigger
        size={size}
        className={cn("w-full min-w-36 sm:w-40", className)}
        aria-label={ariaLabel ?? placeholder}
      >
        <SelectValue placeholder={placeholder}>
          {(selected) =>
            options.find((option) => option.value === selected)?.label ?? placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

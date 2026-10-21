"use client";

import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SALES_MAX_DATE, SALES_MIN_DATE } from "@/lib/sales-dates";

const MIN_DATE = parseISO(`${SALES_MIN_DATE}T12:00:00`);
const MAX_DATE = parseISO(`${SALES_MAX_DATE}T12:00:00`);

interface DashboardDateFilterProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function DashboardDateFilter({ value, onChange }: DashboardDateFilterProps) {
  const [open, setOpen] = useState(false);
  const iso = format(value, "yyyy-MM-dd");
  const label = iso === SALES_MAX_DATE ? `Today: ${format(value, "MMM d, yyyy")}` : format(value, "MMM d, yyyy");
  const disabled = useMemo(() => [{ before: MIN_DATE }, { after: MAX_DATE }], []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" className="h-9 gap-2 font-normal" />}
      >
        <CalendarIcon className="size-4" />
        {label}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (!date) return;
            onChange(date);
            setOpen(false);
          }}
          defaultMonth={value}
          today={MAX_DATE}
          disabled={disabled}
          startMonth={MIN_DATE}
          endMonth={MAX_DATE}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

export { MAX_DATE as DASHBOARD_MAX_DATE };

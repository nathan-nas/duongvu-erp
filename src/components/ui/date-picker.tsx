"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  isoToLocalDate,
  localDateToIso,
  parseViDateToIso,
} from "@/lib/spend/date-range";
import { formatViDate } from "@/lib/spend/format";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  min?: string | null;
  max?: string | null;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function isWithinBounds(
  iso: string,
  min?: string | null,
  max?: string | null,
): boolean {
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "dd/MM/yyyy",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<string | null>(null);
  const selected = value ? isoToLocalDate(value) : undefined;
  const minDate = min ? isoToLocalDate(min) : undefined;
  const maxDate = max ? isoToLocalDate(max) : undefined;
  const display = draft ?? (value ? formatViDate(value) : "");

  function commitText(raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") {
      setDraft(null);
      return;
    }
    const iso = parseViDateToIso(trimmed);
    if (!iso || !isWithinBounds(iso, min, max)) {
      setDraft(null);
      return;
    }
    if (iso !== value) onChange(iso);
    setDraft(null);
  }

  return (
    <div className={cn("flex gap-1.5", className)}>
      <Input
        id={id}
        value={display}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        aria-label={placeholder}
        className="min-w-0 flex-1 tabular-nums"
        onFocus={() => setDraft(value ? formatViDate(value) : "")}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commitText(draft ?? display)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitText(draft ?? display);
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label="Mở lịch"
              className="shrink-0"
            />
          }
        >
          <CalendarIcon className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            onSelect={(date) => {
              if (!date) return;
              onChange(localDateToIso(date));
              setDraft(null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

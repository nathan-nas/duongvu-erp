"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  isoToLocalDate,
  localDateToIso,
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

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Chọn ngày",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? isoToLocalDate(value) : undefined;
  const minDate = min ? isoToLocalDate(min) : undefined;
  const maxDate = max ? isoToLocalDate(max) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            data-empty={!selected}
            className={cn(
              "w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        {selected ? formatViDate(value) : <span>{placeholder}</span>}
        <ChevronDownIcon data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
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
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

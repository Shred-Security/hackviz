"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Link2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Props {
  chains: string[];
  value: string | null;
  onChange: (chain: string | null) => void;
}

export function ChainCombobox({ chains, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-label={value ? `Chain filter: ${value}` : "Filter by chain"}
          className={cn(
            "inline-flex h-10 w-[8.25rem] shrink-0 items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-colors sm:w-auto sm:min-w-[10.5rem]",
            value
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border/60 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate">{value ?? "All chains"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
        align="end"
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder="Search chains..." />
          <CommandList className="max-h-[min(50vh,18rem)]">
            <CommandEmpty>No chain found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all-chains"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check className={cn("h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                All chains
              </CommandItem>
              {chains.map((chain) => (
                <CommandItem
                  key={chain}
                  value={chain}
                  onSelect={() => {
                    onChange(chain === value ? null : chain);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("h-4 w-4", value === chain ? "opacity-100" : "opacity-0")}
                  />
                  {chain}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

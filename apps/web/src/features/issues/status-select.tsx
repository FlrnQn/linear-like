import type { IssueStatus } from '@lynx/types'
import { cn } from '@lynx/shared'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

import { ISSUE_STATUSES, STATUS_DOT_COLORS, STATUS_LABELS } from './status-priority'

export function StatusSelect({
  value,
  onChange,
}: {
  value: IssueStatus
  onChange: (status: IssueStatus) => void
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={(next) => onChange(next as IssueStatus)}>
      <SelectPrimitive.Trigger
        aria-label="Status"
        className="border-border bg-background focus:border-accent inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm outline-none"
      >
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full transition-colors duration-300',
            STATUS_DOT_COLORS[value],
          )}
        />
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        {/* A plain data-state CSS transition, not forceMount+Motion: Radix's
            own Presence util waits for this transition before unmounting, so
            the exit still animates — and Items stay registered through a
            normal close/reopen cycle, which forceMount here does not (see
            git history) — forceMount left Radix's Value with nothing to look
            the current value's label up against once Items were torn down. */}
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="border-border bg-surface z-50 overflow-hidden rounded-md border shadow-lg transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        >
          <SelectPrimitive.Viewport className="p-1">
            {ISSUE_STATUSES.map((status) => (
              <SelectPrimitive.Item
                key={status}
                value={status}
                className="data-[highlighted]:bg-background flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_COLORS[status])} />
                <SelectPrimitive.ItemText>{STATUS_LABELS[status]}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto">
                  <Check className="h-3.5 w-3.5" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

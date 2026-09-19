import type { IssuePriority } from '@lynx/types'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ISSUE_PRIORITIES, PRIORITY_LABEL_KEYS } from './status-priority'

export function PrioritySelect({
  value,
  onChange,
}: {
  value: IssuePriority
  onChange: (priority: IssuePriority) => void
}) {
  const { t } = useTranslation()

  return (
    <SelectPrimitive.Root value={value} onValueChange={(next) => onChange(next as IssuePriority)}>
      <SelectPrimitive.Trigger
        aria-label={t('issue.fields.priority')}
        className="border-border bg-background focus:border-accent inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm outline-none"
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        {/* See status-select.tsx: a data-state CSS transition (not
            forceMount+Motion) — Radix's Presence util waits for it before
            unmounting, so the close still animates without breaking Value's
            item registry. */}
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="border-border bg-surface z-50 overflow-hidden rounded-md border shadow-lg transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        >
          <SelectPrimitive.Viewport className="p-1">
            {ISSUE_PRIORITIES.map((priority) => (
              <SelectPrimitive.Item
                key={priority}
                value={priority}
                className="data-[highlighted]:bg-background flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none"
              >
                <SelectPrimitive.ItemText>{t(PRIORITY_LABEL_KEYS[priority])}</SelectPrimitive.ItemText>
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

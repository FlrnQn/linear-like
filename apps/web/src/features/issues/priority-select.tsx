import type { IssuePriority } from '@lynx/types'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { ISSUE_PRIORITIES, PRIORITY_LABELS } from './status-priority'

export function PrioritySelect({
  value,
  onChange,
}: {
  value: IssuePriority
  onChange: (priority: IssuePriority) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => onChange(next as IssuePriority)}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectPrimitive.Trigger className="border-border bg-background focus:border-accent inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm outline-none">
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <SelectPrimitive.Portal forceMount>
            <SelectPrimitive.Content asChild position="popper" sideOffset={4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.12 }}
                className="border-border bg-surface z-50 overflow-hidden rounded-md border shadow-lg"
              >
                <SelectPrimitive.Viewport className="p-1">
                  {ISSUE_PRIORITIES.map((priority) => (
                    <SelectPrimitive.Item
                      key={priority}
                      value={priority}
                      className="data-[highlighted]:bg-background flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none"
                    >
                      <SelectPrimitive.ItemText>
                        {PRIORITY_LABELS[priority]}
                      </SelectPrimitive.ItemText>
                      <SelectPrimitive.ItemIndicator className="ml-auto">
                        <Check className="h-3.5 w-3.5" />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </motion.div>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        )}
      </AnimatePresence>
    </SelectPrimitive.Root>
  )
}

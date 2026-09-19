import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>
}

export function Tooltip({
  content,
  children,
  side = 'right',
}: {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <TooltipPrimitive.Portal forceMount>
            <TooltipPrimitive.Content asChild side={side} sideOffset={8}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.12 }}
                className="bg-foreground text-background rounded-md px-2 py-1 text-xs shadow-lg"
              >
                {content}
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Root>
  )
}

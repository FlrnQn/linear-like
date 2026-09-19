import { cn } from '@lynx/shared'
import { AnimatePresence, motion } from 'motion/react'

import { useToastStore } from '@/stores/toast-store'

export function ToastStack() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => dismiss(toast.id)}
            className={cn(
              'pointer-events-auto max-w-sm cursor-pointer rounded-lg border px-4 py-2.5 text-sm shadow-lg',
              'border-border bg-surface text-foreground',
              toast.variant === 'success' && 'border-emerald-500/40',
              toast.variant === 'error' && 'border-red-500/40',
            )}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

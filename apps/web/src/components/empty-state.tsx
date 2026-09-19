import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Scene3D } from '@/features/three/scene-3d'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
  /** Reserve the 3D LYNX object for the one or two most prominent empty states — not every "no X yet" line. */
  scene?: boolean
  /** Single-line icon + text, for empty states inside an already-compact section (e.g. a card's cycle list). */
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  scene,
  compact,
}: EmptyStateProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const showScene = scene && !prefersReducedMotion

  if (compact) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        {title}
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {showScene ? (
        <Scene3D variant="empty" className="mb-1 h-24 w-24" />
      ) : (
        Icon && <Icon className="text-muted-foreground mb-1 h-8 w-8" aria-hidden />
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-muted-foreground max-w-xs text-sm">{description}</p>}
      {action}
    </div>
  )
}

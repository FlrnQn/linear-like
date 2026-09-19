import { lazy, Suspense } from 'react'

import { ErrorBoundary } from '@/components/error-boundary'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

import type { Scene3DVariant } from './types'

const LynxCanvas = lazy(() => import('./lynx-canvas'))

// The one place the app touches React Three Fiber. Every caller goes through
// here rather than importing LynxCanvas directly, so the reduced-motion gate,
// the lazy chunk boundary, and the error isolation are never accidentally
// skipped — per spec, the 3D accent must stay "légère, désactivable,
// performante" and never risk taking a page down if WebGL misbehaves.
export function Scene3D({ variant, className }: { variant: Scene3DVariant; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) return null

  return (
    <div className={className}>
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <LynxCanvas variant={variant} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

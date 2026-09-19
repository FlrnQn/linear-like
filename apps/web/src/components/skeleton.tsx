import { cn } from '@lynx/shared'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-border animate-pulse rounded-md', className)} />
}

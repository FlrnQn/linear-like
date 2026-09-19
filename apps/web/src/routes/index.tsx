import { cn } from '@lynx/shared'
import { createFileRoute } from '@tanstack/react-router'

import { useHealthCheck } from '@/hooks/use-health-check'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const health = useHealthCheck()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
          Phase 1 — Foundations
        </span>
        <h1 className="text-5xl font-semibold tracking-tight">LYNX</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Monorepo scaffold is live. Business features arrive in the next phases.
        </p>
      </div>

      <div className="border-border bg-surface w-full max-w-sm rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">System status</h2>
          <button
            type="button"
            onClick={() => void health.refetch()}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Refresh
          </button>
        </div>

        {health.status === 'loading' || health.status === 'idle' ? (
          <p className="text-muted-foreground text-sm">Checking services…</p>
        ) : health.status === 'error' ? (
          <StatusRow label="API" state="error" detail={health.error} />
        ) : (
          <div className="flex flex-col gap-3">
            <StatusRow label="API" state="ok" />
            <StatusRow label="PostgreSQL" state={health.data.services.postgres} />
            <StatusRow label="Redis" state={health.data.services.redis} />
          </div>
        )}
      </div>
    </main>
  )
}

function StatusRow({
  label,
  state,
  detail,
}: {
  label: string
  state: 'ok' | 'error'
  detail?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        {detail && <span className="text-muted-foreground text-xs">{detail}</span>}
        <span
          className={cn('h-2 w-2 rounded-full', state === 'ok' ? 'bg-emerald-500' : 'bg-red-500')}
        />
      </span>
    </div>
  )
}

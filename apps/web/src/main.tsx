import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppProviders } from './app/providers'
import { ErrorBoundary } from './components/error-boundary'
import './styles/globals.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const crashFallback = (
  <div className="dark bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
    <p className="text-lg font-semibold">Something went wrong</p>
    <p className="text-muted-foreground text-sm">
      Try reloading the page. If this keeps happening, your work in any open form may not be saved.
    </p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="bg-accent text-accent-foreground mt-2 rounded-lg px-3 py-1.5 text-sm font-medium"
    >
      Reload
    </button>
  </div>
)

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary fallback={crashFallback}>
      <AppProviders />
    </ErrorBoundary>
  </StrictMode>,
)

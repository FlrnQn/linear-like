import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
}

// React has no hook-based error boundary API — a class component is still
// the only way to implement one. Used to isolate risky third-party visual
// widgets (e.g. the WebGL scenes) so a failure there can't take the rest of
// the page down with it.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

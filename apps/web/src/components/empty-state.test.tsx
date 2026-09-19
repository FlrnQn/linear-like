import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from './empty-state'

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(),
}))

vi.mock('@/hooks/use-prefers-reduced-motion', () => ({ usePrefersReducedMotion }))
// jsdom has no WebGL context — the 3D scene itself is out of scope for a unit
// test, so it's replaced with a marker to verify EmptyState's own branching.
vi.mock('@/features/three/scene-3d', () => ({
  Scene3D: () => <div data-testid="scene-3d" />,
}))

describe('EmptyState', () => {
  it('renders the 3D scene when scene is requested and motion is not reduced', () => {
    usePrefersReducedMotion.mockReturnValue(false)
    render(<EmptyState scene title="No issues yet" />)

    expect(screen.getByTestId('scene-3d')).toBeInTheDocument()
    expect(screen.getByText('No issues yet')).toBeInTheDocument()
  })

  it('falls back to the icon when scene is requested but motion is reduced', () => {
    usePrefersReducedMotion.mockReturnValue(true)
    render(<EmptyState scene icon={Users} title="No issues yet" />)

    expect(screen.queryByTestId('scene-3d')).not.toBeInTheDocument()
  })

  it('renders a single compact line with no heading/description block', () => {
    usePrefersReducedMotion.mockReturnValue(false)
    render(<EmptyState title="No cycles yet." compact />)

    expect(screen.getByText('No cycles yet.')).toBeInTheDocument()
    expect(screen.queryByTestId('scene-3d')).not.toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    usePrefersReducedMotion.mockReturnValue(true)
    render(
      <EmptyState icon={Users} title="No teams yet" description="Create one to get started." />,
    )

    expect(screen.getByText('Create one to get started.')).toBeInTheDocument()
  })
})

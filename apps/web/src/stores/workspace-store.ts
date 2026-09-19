import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
    }),
    { name: 'lynx-workspace' },
  ),
)

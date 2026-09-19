import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// `globals: false` means Testing Library's implicit afterEach-cleanup
// registration never fires, so unmounted renders would otherwise pile up
// in `document.body` across tests within the same file.
afterEach(() => {
  cleanup()
})

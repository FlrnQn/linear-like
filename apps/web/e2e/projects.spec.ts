import { expect, test } from '@playwright/test'

import { createWorkspaceViaApi, signupViaApi } from './helpers'

test('creates a project from the home page', async ({ page, request }) => {
  const user = await signupViaApi(request)
  await createWorkspaceViaApi(request, user.accessToken, { name: 'E2E Projects Workspace' })

  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')

  await page.getByLabel('Project name').fill('Mobile Redesign')
  await page.getByRole('button', { name: 'Add project' }).click()

  // Also appears in the home page's own "Projects" list — scope to the
  // sidebar nav for an unambiguous match.
  const projectLink = page.getByRole('navigation').getByRole('link', { name: 'Mobile Redesign' })
  await expect(projectLink).toBeVisible()

  await projectLink.click()
  await expect(page.getByRole('heading', { name: 'Mobile Redesign' })).toBeVisible()
})

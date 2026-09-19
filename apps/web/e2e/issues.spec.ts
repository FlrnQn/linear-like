import { expect, test } from '@playwright/test'

import { createTeamViaApi, createWorkspaceViaApi, signupViaApi } from './helpers'

test('creates an issue, edits its title, changes status, and assigns it', async ({
  page,
  request,
}) => {
  const user = await signupViaApi(request)
  const workspace = await createWorkspaceViaApi(request, user.accessToken)
  const team = await createTeamViaApi(request, user.accessToken, workspace.id, {
    name: 'Engineering',
  })

  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')

  // The team also appears in the home page's own "Teams" list (with its key
  // appended) — scope to the sidebar nav for an unambiguous exact match.
  await page.getByRole('navigation').getByRole('link', { name: team.name, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/teams/${team.id}`))

  await page.getByRole('button', { name: 'New issue' }).click()
  await page.getByPlaceholder('Issue title').fill('Fix the login page')
  await page.getByRole('button', { name: 'Create issue' }).click()

  const issueRow = page.getByText('Fix the login page')
  await expect(issueRow).toBeVisible()
  await issueRow.click()

  // Edit issue: the title field is a real input now, not read-only text.
  const titleInput = page.getByLabel('Issue title')
  await expect(titleInput).toHaveValue('Fix the login page')
  await titleInput.fill('Fix the broken login page')
  await titleInput.blur()
  await expect(titleInput).toHaveValue('Fix the broken login page')

  // Change status via the animated Radix dropdown.
  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'In Progress' }).click()
  await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('In Progress')

  // Assign to self — the only workspace member available.
  await page.getByLabel('Assignee').selectOption({ label: user.name })
  await expect(page.getByLabel('Assignee')).toHaveValue(user.userId)

  // Reload to confirm every change actually persisted server-side, not just
  // in local state. The dialog's open state lives in local component state
  // (not the URL), so reloading closes it — reopen the same issue first.
  await page.reload()
  await page.getByText('Fix the broken login page').click()
  await expect(page.getByLabel('Issue title')).toHaveValue('Fix the broken login page')
  await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('In Progress')
  await expect(page.getByLabel('Assignee')).toHaveValue(user.userId)
})

test('rejects creating an issue for a team the user does not belong to', async ({
  page,
  request,
}) => {
  const owner = await signupViaApi(request)
  const workspace = await createWorkspaceViaApi(request, owner.accessToken)
  const team = await createTeamViaApi(request, owner.accessToken, workspace.id)

  const outsider = await signupViaApi(request)
  const response = await request.post('http://localhost:4010/issues', {
    headers: { Authorization: `Bearer ${outsider.accessToken}` },
    data: { teamId: team.id, title: 'Should not be allowed' },
  })

  expect(response.status()).toBe(403)
  // The outsider's own browser session never sees this team at all.
  await page.goto('/login')
  await page.getByLabel('Email').fill(outsider.email)
  await page.getByLabel('Password').fill(outsider.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: team.name })).toHaveCount(0)
})

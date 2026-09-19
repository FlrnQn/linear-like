import { expect, test } from '@playwright/test'

function uniqueEmail() {
  return `e2e-auth-${Date.now()}@example.com`
}

test('signs up, is redirected to the home page, and can sign out', async ({ page }) => {
  const email = uniqueEmail()

  await page.goto('/signup')
  await page.getByLabel('Name').fill('Ada Lovelace')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText(/Welcome back, Ada/)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('logs in with correct credentials and rejects the wrong password', async ({ page }) => {
  const email = uniqueEmail()

  await page.goto('/signup')
  await page.getByLabel('Name').fill('Login Test')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('correct-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: 'Sign out' }).click()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()

  await page.getByLabel('Password').fill('correct-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
})

test('redirects an unauthenticated visitor to /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

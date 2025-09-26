import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page before each test
    await page.goto('/');
  });

  test('should display landing page with login and register buttons', async ({ page }) => {
    // Check for main landing page elements
    await expect(page.getByRole('heading', { name: /stockent/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login button
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check if redirected to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register button
    await page.getByRole('button', { name: /register/i }).click();
    
    // Check if redirected to register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
  });

  test('should show login form with required fields', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should show register form with required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Check for register form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByLabel(/contact person/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    await expect(page.getByLabel(/country/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible();
  });

  test('should validate login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check for validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should validate register form', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /register/i }).click();
    
    // Check for validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
    await expect(page.getByText(/company name is required/i)).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should handle successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in valid credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check if redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('should handle successful registration', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in registration form
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/company name/i).fill('New Company');
    await page.getByLabel(/contact person/i).fill('New User');
    await page.getByLabel(/phone/i).fill('+1234567890');
    await page.getByLabel(/country/i).selectOption('US');
    
    // Submit form
    await page.getByRole('button', { name: /register/i }).click();
    
    // Check for success message
    await expect(page.getByText(/registration successful/i)).toBeVisible();
  });

  test('should handle Google OAuth login', async ({ page }) => {
    await page.goto('/login');
    
    // Click Google OAuth button
    await page.getByRole('button', { name: /google/i }).click();
    
    // Check if redirected to Google OAuth
    await expect(page).toHaveURL(/.*google.*oauth/);
  });

  test('should show password reset link', async ({ page }) => {
    await page.goto('/login');
    
    // Check for password reset link
    await expect(page.getByText(/forgot password/i)).toBeVisible();
    
    // Click password reset link
    await page.getByText(/forgot password/i).click();
    
    // Check if redirected to password reset page
    await expect(page).toHaveURL(/.*reset-password/);
  });

  test('should handle logout', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Check if redirected to landing page
    await expect(page).toHaveURL('/');
  });

  test('should persist login state on page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Check if still logged in
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check if redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check for loading state
    await expect(page.getByText(/logging in/i)).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/login', route => route.abort());
    
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Check for error message
    await expect(page.getByText(/network error/i)).toBeVisible();
  });
});
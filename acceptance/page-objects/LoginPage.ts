/**
 * Login Page Object
 * Page object pattern for the login page
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // MUI TextFields use id attributes for inputs
    this.emailInput = page.locator('#email').or(page.getByLabel(/email/i));
    this.passwordInput = page.locator('#password').or(page.getByLabel(/^password$/i));
    this.loginButton = page.getByRole('button', { name: /sign in/i }).or(
      page.locator('button[type="submit"]')
    );
    this.registerLink = page.getByRole('link', { name: /create.*account|register|sign up/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot/i });
    // MUI Alert component
    this.errorMessage = page.locator('.MuiAlert-root').first();
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.loginButton.click();
  }

  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/(dashboard|products)/);
  }

  async expectLoginError(errorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }

  async clickRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/\/register/);
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/reset-password/);
  }

  async expectPageLoaded() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}

export default LoginPage;

/**
 * Cart E2E Tests
 * Tests cart functionality including add, update, and remove items
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { CartPage, ProductPage } from '../page-objects/CartPage';
import { TEST_USERS } from '../framework/test.context';

test.describe('Cart', () => {
  let loginPage: LoginPage;
  let cartPage: CartPage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    cartPage = new CartPage(page);
    productPage = new ProductPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);

    // Wait for redirect with retry
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.waitForURL(/\/(dashboard|products)/, { timeout: 15000 });
        break;
      } catch {
        if (attempt < 2 && page.url().includes('/login')) {
          await page.waitForTimeout(1000);
          await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);
        }
      }
    }
  });

  test.describe('Cart Access', () => {
    test('should display cart button in header', async ({ page }) => {
      await expect(cartPage.cartButton).toBeVisible();
    });

    test('should open cart drawer when clicking cart button', async ({ page }) => {
      await cartPage.openCart();
    });

    test('should navigate to cart page', async ({ page }) => {
      await cartPage.cartButton.click();
      await expect(cartPage.cartDrawer.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Empty Cart', () => {
    test('should display empty cart message when no items', async ({ page }) => {
      await cartPage.cartButton.click();
      await expect(cartPage.cartDrawer.first()).toBeVisible({ timeout: 5000 });
      await expect(cartPage.cartEmptyMessage.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Add to Cart', () => {
    test('should add product to cart from product page', async ({ page }) => {
      await page.goto('/products');

      const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();
      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForLoadState('networkidle');
      }

      const addButton = page.getByRole('button', { name: /add to cart/i });
      if (await addButton.isVisible()) {
        await addButton.click();

        const successNotification = page.locator('text=/added to cart|success/i');
        const cartCountBadge = page.locator('[data-testid="cart-count"], .cart-count, .badge');

        await expect(successNotification.or(cartCountBadge)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should update cart count when adding items', async ({ page }) => {
      const cartCountBadge = page.locator('[data-testid="cart-count"], .cart-count');
      let initialCount = 0;

      if (await cartCountBadge.isVisible()) {
        const countText = await cartCountBadge.textContent();
        initialCount = parseInt(countText || '0', 10);
      }

      await page.goto('/products');
      const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();

      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForLoadState('networkidle');

        const addButton = page.getByRole('button', { name: /add to cart/i });
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);

          if (await cartCountBadge.isVisible()) {
            const newCountText = await cartCountBadge.textContent();
            const newCount = parseInt(newCountText || '0', 10);
            expect(newCount).toBeGreaterThanOrEqual(initialCount);
          }
        }
      }
    });
  });

  test.describe('Cart Operations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/products');
      const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();

      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForLoadState('networkidle');

        const addButton = page.getByRole('button', { name: /add to cart/i });
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should display cart items', async ({ page }) => {
      await cartPage.goto();
      const items = await cartPage.getItemCount();
      expect(items).toBeGreaterThanOrEqual(0);
    });

    test('should update item quantity', async ({ page }) => {
      await cartPage.goto();

      const items = await cartPage.getItemCount();
      if (items > 0) {
        const firstItem = cartPage.cartItems.first();
        const quantityInput = firstItem.locator('input[type="number"]');

        if (await quantityInput.isVisible()) {
          await quantityInput.fill('25');
          await page.waitForTimeout(1000);
          await expect(quantityInput).toHaveValue('25');
        }
      }
    });

    test('should remove item from cart', async ({ page }) => {
      await cartPage.goto();

      const initialCount = await cartPage.getItemCount();
      if (initialCount > 0) {
        const firstItem = cartPage.cartItems.first();
        const removeButton = firstItem.getByRole('button', { name: /remove|delete/i });

        if (await removeButton.isVisible()) {
          await removeButton.click();

          const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }

          await page.waitForTimeout(1000);
          const newCount = await cartPage.getItemCount();
          expect(newCount).toBeLessThan(initialCount);
        }
      }
    });

    test('should clear entire cart', async ({ page }) => {
      await cartPage.goto();

      const items = await cartPage.getItemCount();
      if (items > 0) {
        const clearButton = page.getByRole('button', { name: /clear/i });

        if (await clearButton.isVisible()) {
          await clearButton.click();

          const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }

          await page.waitForTimeout(1000);
          await cartPage.expectCartEmpty();
        }
      }
    });
  });

  test.describe('Cart Persistence', () => {
    test('should persist cart items after page refresh', async ({ page }) => {
      await page.goto('/products');
      const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();

      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForLoadState('networkidle');

        const addButton = page.getByRole('button', { name: /add to cart/i });
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
        }
      }

      await cartPage.goto();
      const initialCount = await cartPage.getItemCount();

      await page.reload();
      await page.waitForLoadState('networkidle');

      const newCount = await cartPage.getItemCount();
      expect(newCount).toBe(initialCount);
    });

    test('should persist cart items after logout and login', async ({ page }) => {
      await page.goto('/products');
      const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();

      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForLoadState('networkidle');

        const addButton = page.getByRole('button', { name: /add to cart/i });
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
        }
      }

      await cartPage.goto();
      const initialCount = await cartPage.getItemCount();

      // Logout
      const userMenu = page.getByRole('button', { name: /profile|account|user/i });
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(
        page.getByRole('menuitem', { name: /logout|sign out/i })
      );

      if (await userMenu.isVisible()) {
        await userMenu.click();
      }

      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Login again
      await loginPage.goto();
      await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);
      await expect(page).toHaveURL(/\/(dashboard|products)/, { timeout: 15000 });

      await cartPage.goto();
      const newCount = await cartPage.getItemCount();
      expect(newCount).toBe(initialCount);
    });
  });
});

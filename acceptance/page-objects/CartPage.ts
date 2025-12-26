/**
 * Cart Page Object
 * Page object pattern for the cart functionality
 */

import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartButton: Locator;
  readonly cartDrawer: Locator;
  readonly cartItems: Locator;
  readonly cartEmptyMessage: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  readonly clearCartButton: Locator;
  readonly cartItemCount: Locator;

  constructor(page: Page) {
    this.page = page;
    // Cart button - specifically target "Shopping cart" aria-label
    this.cartButton = page.getByRole('button', { name: /shopping cart/i });
    // MUI Drawer component
    this.cartDrawer = page.locator('.MuiDrawer-root').filter({ hasText: /cart/i });
    this.cartItems = page.locator('[data-testid="cart-item"], .cart-item');
    this.cartEmptyMessage = page.getByText(/cart is empty|no items|haven't added/i);
    this.cartTotal = page.locator('[data-testid="cart-total"]').or(page.getByText(/total/i));
    this.checkoutButton = page.getByRole('button', { name: /checkout|proceed/i });
    this.clearCartButton = page.getByRole('button', { name: /clear/i });
    this.cartItemCount = page.locator('.MuiBadge-badge');
  }

  async goto() {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  async openCart() {
    await this.cartButton.click();
    await expect(this.cartDrawer.first()).toBeVisible({ timeout: 5000 });
  }

  async closeCart() {
    await this.page.keyboard.press('Escape');
  }

  getCartItemByName(name: string): Locator {
    return this.cartItems.filter({ hasText: name });
  }

  async updateItemQuantity(itemLocator: Locator, quantity: number) {
    const quantityInput = itemLocator.locator('input[type="number"], [data-testid="quantity-input"]');
    await quantityInput.fill(quantity.toString());
    await this.page.waitForTimeout(500);
  }

  async removeItem(itemLocator: Locator) {
    const removeButton = itemLocator.getByRole('button', { name: /remove|delete/i });
    await removeButton.click();
  }

  async clearCart() {
    await this.clearCartButton.click();
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForURL(/\/checkout/);
  }

  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async getCartTotal(): Promise<string> {
    return (await this.cartTotal.textContent()) || '0';
  }

  async expectCartEmpty() {
    await expect(this.cartEmptyMessage).toBeVisible();
    expect(await this.getItemCount()).toBe(0);
  }

  async expectCartHasItems(count?: number) {
    if (count !== undefined) {
      expect(await this.getItemCount()).toBe(count);
    } else {
      expect(await this.getItemCount()).toBeGreaterThan(0);
    }
  }
}

/**
 * Product Page Object (for adding items to cart)
 */
export class ProductPage {
  readonly page: Page;
  readonly addToCartButton: Locator;
  readonly quantityInput: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
    this.quantityInput = page.locator('[data-testid="quantity-input"], input[name="quantity"]');
    this.productTitle = page.locator('h1, [data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"], .product-price');
  }

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async addToCart(quantity?: number) {
    if (quantity) {
      await this.setQuantity(quantity);
    }
    await this.addToCartButton.click();
    await this.page.waitForTimeout(500);
  }

  async getTitle(): Promise<string> {
    return (await this.productTitle.textContent()) || '';
  }
}

export default CartPage;

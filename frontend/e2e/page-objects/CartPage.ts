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
    // Cart button - specifically target "Shopping cart" aria-label to avoid notifications button
    this.cartButton = page.getByRole('button', { name: /shopping cart/i });
    // MUI Drawer component
    this.cartDrawer = page.locator('.MuiDrawer-root').filter({ hasText: /cart/i });
    this.cartItems = page.locator('[data-testid="cart-item"], .cart-item');
    // Empty cart message variations
    this.cartEmptyMessage = page.getByText(/cart is empty|no items|haven't added/i);
    this.cartTotal = page.locator('[data-testid="cart-total"]').or(page.getByText(/total/i));
    this.checkoutButton = page.getByRole('button', { name: /checkout|proceed/i });
    this.clearCartButton = page.getByRole('button', { name: /clear/i });
    this.cartItemCount = page.locator('.MuiBadge-badge');
  }

  /**
   * Navigate to the cart page
   */
  async goto() {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open cart drawer/sidebar
   */
  async openCart() {
    await this.cartButton.click();
    await expect(this.cartDrawer.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close cart drawer
   */
  async closeCart() {
    // Press Escape or click outside
    await this.page.keyboard.press('Escape');
  }

  /**
   * Get cart item by product name
   */
  getCartItemByName(name: string): Locator {
    return this.cartItems.filter({ hasText: name });
  }

  /**
   * Update quantity for a cart item
   */
  async updateItemQuantity(itemLocator: Locator, quantity: number) {
    const quantityInput = itemLocator.locator('input[type="number"], [data-testid="quantity-input"]');
    await quantityInput.fill(quantity.toString());
    // Wait for debounce and update
    await this.page.waitForTimeout(500);
  }

  /**
   * Remove an item from cart
   */
  async removeItem(itemLocator: Locator) {
    const removeButton = itemLocator.getByRole('button', { name: /remove|delete/i });
    await removeButton.click();
  }

  /**
   * Clear all items from cart
   */
  async clearCart() {
    await this.clearCartButton.click();
    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForURL(/\/checkout/);
  }

  /**
   * Get number of items in cart
   */
  async getItemCount(): Promise<number> {
    const count = await this.cartItems.count();
    return count;
  }

  /**
   * Get cart total value
   */
  async getCartTotal(): Promise<string> {
    const totalText = await this.cartTotal.textContent();
    return totalText || '0';
  }

  /**
   * Expect cart to be empty
   */
  async expectCartEmpty() {
    await expect(this.cartEmptyMessage).toBeVisible();
    expect(await this.getItemCount()).toBe(0);
  }

  /**
   * Expect cart to have items
   */
  async expectCartHasItems(count?: number) {
    if (count !== undefined) {
      expect(await this.getItemCount()).toBe(count);
    } else {
      expect(await this.getItemCount()).toBeGreaterThan(0);
    }
  }

  /**
   * Expect item to be in cart
   */
  async expectItemInCart(productName: string) {
    const item = this.getCartItemByName(productName);
    await expect(item).toBeVisible();
  }

  /**
   * Expect item not to be in cart
   */
  async expectItemNotInCart(productName: string) {
    const item = this.getCartItemByName(productName);
    await expect(item).not.toBeVisible();
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

  /**
   * Navigate to a product page
   */
  async goto(productId: string) {
    await this.page.goto(`/products/${productId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Set quantity
   */
  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  /**
   * Add current product to cart
   */
  async addToCart(quantity?: number) {
    if (quantity) {
      await this.setQuantity(quantity);
    }
    await this.addToCartButton.click();
    // Wait for cart update
    await this.page.waitForTimeout(500);
  }

  /**
   * Get product title
   */
  async getTitle(): Promise<string> {
    const title = await this.productTitle.textContent();
    return title || '';
  }
}

export default CartPage;

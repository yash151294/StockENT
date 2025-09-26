import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate to products page
    await page.getByRole('button', { name: /products/i }).click();
    await expect(page).toHaveURL(/.*products/);
  });

  test('should display products page with search and filters', async ({ page }) => {
    // Check for main elements
    await expect(page.getByText(/products/i)).toBeVisible();
    await expect(page.getByPlaceholderText(/search products/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /filter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sort/i })).toBeVisible();
  });

  test('should display product cards', async ({ page }) => {
    // Wait for products to load
    await expect(page.getByText('Premium Cotton Fabric')).toBeVisible();
    await expect(page.getByText('Polyester Blend Fabric')).toBeVisible();
    
    // Check for product card elements
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCount(2);
  });

  test('should handle product search', async ({ page }) => {
    // Search for products
    await page.getByPlaceholderText(/search products/i).fill('cotton');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Check if search results are displayed
    await expect(page.getByText('Premium Cotton Fabric')).toBeVisible();
    await expect(page.getByText('Polyester Blend Fabric')).not.toBeVisible();
  });

  test('should handle category filtering', async ({ page }) => {
    // Open filter menu
    await page.getByRole('button', { name: /filter/i }).click();
    
    // Select category filter
    await page.getByRole('button', { name: /category/i }).click();
    await page.getByText('Cotton').click();
    
    // Apply filter
    await page.getByRole('button', { name: /apply/i }).click();
    
    // Check if filtered results are displayed
    await expect(page.getByText('Premium Cotton Fabric')).toBeVisible();
  });

  test('should handle price range filtering', async ({ page }) => {
    // Open filter menu
    await page.getByRole('button', { name: /filter/i }).click();
    
    // Set price range
    await page.getByLabel(/min price/i).fill('20');
    await page.getByLabel(/max price/i).fill('30');
    
    // Apply filter
    await page.getByRole('button', { name: /apply/i }).click();
    
    // Check if filtered results are displayed
    await expect(page.getByText('Premium Cotton Fabric')).toBeVisible();
  });

  test('should handle sorting options', async ({ page }) => {
    // Open sort menu
    await page.getByRole('button', { name: /sort/i }).click();
    
    // Select sort option
    await page.getByText('Price: Low to High').click();
    
    // Check if products are sorted
    await expect(page.getByText('Polyester Blend Fabric')).toBeVisible();
    await expect(page.getByText('Premium Cotton Fabric')).toBeVisible();
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Click on a product card
    await page.getByText('Premium Cotton Fabric').click();
    
    // Check if redirected to product detail page
    await expect(page).toHaveURL(/.*products\/product-1/);
    await expect(page.getByText('Premium Cotton Fabric')).toBeVisible();
  });

  test('should handle product watchlist', async ({ page }) => {
    // Click watchlist button on first product
    const watchlistButton = page.locator('[data-testid="product-card"]').first().getByRole('button', { name: /watchlist/i });
    await watchlistButton.click();
    
    // Check if watchlist state changes
    await expect(watchlistButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle pagination', async ({ page }) => {
    // Check for pagination controls
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // Click next page
      await page.getByRole('button', { name: /next/i }).click();
      
      // Check if page changed
      await expect(page.getByText(/page 2/i)).toBeVisible();
    }
  });

  test('should handle empty search results', async ({ page }) => {
    // Search for non-existent product
    await page.getByPlaceholderText(/search products/i).fill('nonexistent');
    await page.getByRole('button', { name: /search/i }).click();
    
    // Check for empty state message
    await expect(page.getByText(/no products found/i)).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Check for loading indicators
    const loadingElements = page.locator('[data-testid="loading"]');
    await expect(loadingElements).toHaveCount(0); // No loading by default
  });

  test('should handle error state', async ({ page }) => {
    // Mock API error
    await page.route('**/api/products', route => route.abort());
    
    // Reload page to trigger error
    await page.reload();
    
    // Check for error message
    await expect(page.getByText(/error loading products/i)).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile layout is applied
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
  });

  test('should handle filter reset', async ({ page }) => {
    // Apply some filters
    await page.getByPlaceholderText(/search products/i).fill('cotton');
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('button', { name: /category/i }).click();
    await page.getByText('Cotton').click();
    await page.getByRole('button', { name: /apply/i }).click();
    
    // Reset filters
    await page.getByRole('button', { name: /reset/i }).click();
    
    // Check if filters are reset
    await expect(page.getByPlaceholderText(/search products/i)).toHaveValue('');
  });

  test('should handle product image loading', async ({ page }) => {
    // Check for product images
    const productImages = page.locator('[data-testid="product-card"] img');
    await expect(productImages).toHaveCount(2);
    
    // Check if images have proper alt text
    await expect(productImages.first()).toHaveAttribute('alt', 'Cotton fabric');
  });

  test('should handle product status display', async ({ page }) => {
    // Check for product status indicators
    const statusIndicators = page.locator('[data-testid="product-card"] [data-testid="status"]');
    await expect(statusIndicators).toHaveCount(2);
    
    // Check if status is displayed correctly
    await expect(statusIndicators.first()).toHaveText('ACTIVE');
  });

  test('should handle product specifications display', async ({ page }) => {
    // Click on a product card to view details
    await page.getByText('Premium Cotton Fabric').click();
    
    // Check if product specifications are displayed
    await expect(page.getByText('Weight: 150 GSM')).toBeVisible();
    await expect(page.getByText('Width: 60 inches')).toBeVisible();
  });

  test('should handle product seller information', async ({ page }) => {
    // Click on a product card to view details
    await page.getByText('Premium Cotton Fabric').click();
    
    // Check if seller information is displayed
    await expect(page.getByText('Seller Company')).toBeVisible();
    await expect(page.getByText('Seller User')).toBeVisible();
  });

  test('should handle product contact functionality', async ({ page }) => {
    // Click on a product card to view details
    await page.getByText('Premium Cotton Fabric').click();
    
    // Click contact seller button
    await page.getByRole('button', { name: /contact seller/i }).click();
    
    // Check if contact form or message is displayed
    await expect(page.getByText(/contact/i)).toBeVisible();
  });
});
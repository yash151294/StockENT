/**
 * Utility functions for handling image URLs
 */

const BACKEND_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

/**
 * Converts a relative image URL to a full backend URL
 * @param imageUrl - The image URL from the API (can be relative or absolute)
 * @param type - The type of image ('product', 'user', or 'avatar')
 * @returns Full URL to the image
 */
export const getImageUrl = (imageUrl: string | undefined | null, type: 'product' | 'user' | 'avatar' = 'product'): string => {
  if (!imageUrl) {
    // Return appropriate placeholder based on type
    switch (type) {
      case 'user':
      case 'avatar':
        return `${BACKEND_URL}/uploads/users/placeholder-avatar.jpg`;
      case 'product':
      default:
        return `${BACKEND_URL}/uploads/products/placeholder-product.jpg`;
    }
  }

  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path starting with /uploads, prepend backend URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${BACKEND_URL}${imageUrl}`;
  }

  // If it's just a filename, determine the folder based on type
  if (!imageUrl.includes('/')) {
    switch (type) {
      case 'user':
      case 'avatar':
        return `${BACKEND_URL}/uploads/users/${imageUrl}`;
      case 'product':
      default:
        return `${BACKEND_URL}/uploads/products/${imageUrl}`;
    }
  }

  // Default fallback based on type
  switch (type) {
    case 'user':
    case 'avatar':
      return `${BACKEND_URL}/uploads/users/placeholder-avatar.jpg`;
    case 'product':
    default:
      return `${BACKEND_URL}/uploads/products/placeholder-product.jpg`;
  }
};

/**
 * Gets the placeholder image URL
 * @returns Full URL to the placeholder image
 */
export const getPlaceholderImageUrl = (): string => {
  return `${BACKEND_URL}/uploads/products/placeholder-product.jpg`;
};

/**
 * Checks if an image URL is valid
 * @param imageUrl - The image URL to check
 * @returns True if the URL appears to be valid
 */
export const isValidImageUrl = (imageUrl: string | undefined | null): boolean => {
  if (!imageUrl) return false;
  
  // Check if it's a valid URL format
  try {
    new URL(imageUrl);
    return true;
  } catch {
    // If it's not a full URL, check if it's a valid relative path
    return imageUrl.startsWith('/uploads/') || imageUrl.includes('.');
  }
};

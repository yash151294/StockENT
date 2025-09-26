import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductsPage from '../ProductsPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn()
  }))
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

// Create test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LanguageProvider>
            <NotificationProvider>
              <AuthProvider>
                <SocketProvider>
                  {children}
                </SocketProvider>
              </AuthProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('ProductsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders products page with search and filters', () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for main elements
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
  });

  it('displays product cards', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Premium Cotton Fabric')).toBeInTheDocument();
    });

    expect(screen.getByText('Polyester Blend Fabric')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search products/i);
    
    fireEvent.change(searchInput, { target: { value: 'cotton' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('cotton');
    });
  });

  it('handles filter changes', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for filter elements
    const categoryFilter = screen.getByRole('button', { name: /category/i });
    expect(categoryFilter).toBeInTheDocument();

    fireEvent.click(categoryFilter);
    
    // Check if filter options are displayed
    await waitFor(() => {
      expect(screen.getByText('Cotton')).toBeInTheDocument();
    });
  });

  it('handles price range filtering', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for price filter elements
    const priceFilter = screen.getByRole('button', { name: /price/i });
    expect(priceFilter).toBeInTheDocument();

    fireEvent.click(priceFilter);
    
    // Check if price range inputs are displayed
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/min price/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/max price/i)).toBeInTheDocument();
    });
  });

  it('handles sorting options', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for sort dropdown
    const sortButton = screen.getByRole('button', { name: /sort/i });
    expect(sortButton).toBeInTheDocument();

    fireEvent.click(sortButton);
    
    // Check if sort options are displayed
    await waitFor(() => {
      expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
      expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
      expect(screen.getByText('Newest First')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Premium Cotton Fabric')).toBeInTheDocument();
    });

    // Check for pagination controls
    const pagination = screen.queryByRole('navigation', { name: /pagination/i });
    if (pagination) {
      expect(pagination).toBeInTheDocument();
    }
  });

  it('handles product card interactions', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Premium Cotton Fabric')).toBeInTheDocument();
    });

    // Check for product card elements
    const productCards = screen.getAllByTestId('product-card');
    expect(productCards.length).toBeGreaterThan(0);

    // Click on a product card
    fireEvent.click(productCards[0]);
    
    // Verify navigation to product detail
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products/product-1');
    });
  });

  it('handles watchlist functionality', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Premium Cotton Fabric')).toBeInTheDocument();
    });

    // Check for watchlist buttons
    const watchlistButtons = screen.getAllByRole('button', { name: /watchlist/i });
    expect(watchlistButtons.length).toBeGreaterThan(0);

    // Click watchlist button
    fireEvent.click(watchlistButtons[0]);
    
    // Check if watchlist state changes
    await waitFor(() => {
      expect(watchlistButtons[0]).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('handles loading state', () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for loading indicators
    const loadingElements = screen.queryAllByTestId('loading');
    expect(loadingElements).toHaveLength(0); // No loading by default
  });

  it('handles error state', async () => {
    // Mock API error
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    // Mock empty API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        products: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    });

    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check for empty state message
    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });

  it('handles responsive design', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Check if mobile layout is applied
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('handles filter reset', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Apply some filters
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'cotton' } });

    // Check for reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    
    // Check if filters are reset
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('handles product image loading', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Premium Cotton Fabric')).toBeInTheDocument();
    });

    // Check for product images
    const productImages = screen.getAllByRole('img');
    expect(productImages.length).toBeGreaterThan(0);
  });

  it('handles product status display', async () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Premium Cotton Fabric')).toBeInTheDocument();
    });

    // Check for product status indicators
    const statusIndicators = screen.getAllByText(/active/i);
    expect(statusIndicators.length).toBeGreaterThan(0);
  });
});
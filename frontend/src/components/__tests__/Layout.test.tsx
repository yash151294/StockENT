import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from '../Layout';
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
  useLocation: () => ({ pathname: '/dashboard' })
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

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders layout with navigation', () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="main-content">Main Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('displays navigation menu items', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Auctions')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('shows user profile section', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for user profile elements
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles mobile menu toggle', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Find and click mobile menu button
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();

    fireEvent.click(menuButton);
    
    // Check if mobile menu is opened
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays notifications', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for notification elements
    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
  });

  it('handles language switching', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for language selector
    const languageButton = screen.getByRole('button', { name: /language/i });
    expect(languageButton).toBeInTheDocument();
  });

  it('shows logout option', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('handles responsive design', () => {
    // Mock window.innerWidth for mobile view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check if mobile layout is applied
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('displays current page title', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check if page title is displayed
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('handles navigation clicks', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Click on Products navigation
    const productsLink = screen.getByText('Products');
    fireEvent.click(productsLink);

    // Verify navigation was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });

  it('shows loading state', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for loading indicators if any
    const loadingElements = screen.queryAllByTestId('loading');
    expect(loadingElements).toHaveLength(0); // No loading by default
  });

  it('handles error states gracefully', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <Layout>
          <div>Content</div>
        </Layout>
      </TestWrapper>
    );

    // Layout should render without errors
    expect(screen.getByTestId('main-content')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
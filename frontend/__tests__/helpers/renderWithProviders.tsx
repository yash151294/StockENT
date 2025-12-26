/**
 * Test Render Utility
 * Provides wrapped render function with all required providers
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock providers - simplified versions for testing
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const MockSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const MockNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Provider options interface
interface WrapperProps {
  children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRouterPath?: string;
  authState?: {
    user: unknown | null;
    isAuthenticated: boolean;
  };
}

interface CustomRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
  queryClient: QueryClient;
}

/**
 * Render with all providers
 * Use this for components that need the full app context
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult => {
  const {
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options;

  const AllProviders: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MockNotificationProvider>
        <MockSocketProvider>
          <MockAuthProvider>
            {children}
          </MockAuthProvider>
        </MockSocketProvider>
      </MockNotificationProvider>
    </QueryClientProvider>
  );

  const user = userEvent.setup();

  return {
    user,
    queryClient,
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  };
};

/**
 * Render with only QueryClient provider
 * Use this for simpler components or hooks tests
 */
export const renderWithQueryClient = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const QueryWrapper: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const user = userEvent.setup();

  return {
    user,
    queryClient,
    ...render(ui, { wrapper: QueryWrapper, ...renderOptions }),
  };
};

/**
 * Create wrapper for renderHook
 * Use this when testing custom hooks
 */
export const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>
        <MockNotificationProvider>
          <MockSocketProvider>
            <MockAuthProvider>
              {children}
            </MockAuthProvider>
          </MockSocketProvider>
        </MockNotificationProvider>
      </QueryClientProvider>
    );
  };
};

/**
 * Wait for loading states to complete
 */
export const waitForLoadingToFinish = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent };
export { createTestQueryClient };

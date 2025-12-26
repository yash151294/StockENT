/**
 * MSW Server Setup
 * Creates a mock server for intercepting API requests during tests
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create server with default handlers
export const server = setupServer(...handlers);

// Export for use in tests
export default server;

// Utility to reset handlers between tests
export const resetHandlers = () => {
  server.resetHandlers();
};

// Utility to add custom handlers for specific tests
export const useHandlers = (customHandlers: Parameters<typeof server.use>) => {
  server.use(...customHandlers);
};

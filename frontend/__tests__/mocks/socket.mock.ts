/**
 * Socket.io Mock
 * Mocks socket.io-client for testing real-time features
 */

import { EventEmitter } from 'events';

// Create a mock socket instance
export class MockSocket extends EventEmitter {
  public connected = false;
  public id = 'mock-socket-id';

  constructor() {
    super();
    // Simulate connection after creation
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
    }, 0);
  }

  connect() {
    if (!this.connected) {
      this.connected = true;
      this.emit('connect');
    }
    return this;
  }

  disconnect() {
    if (this.connected) {
      this.connected = false;
      this.emit('disconnect');
    }
    return this;
  }

  close() {
    return this.disconnect();
  }

  // Override emit to allow chaining
  emit(event: string, ...args: unknown[]): boolean {
    super.emit(event, ...args);
    return true;
  }

  // Mock joining a room
  join(room: string) {
    this.emit('joined', room);
    return this;
  }

  // Mock leaving a room
  leave(room: string) {
    this.emit('left', room);
    return this;
  }
}

// Mock socket instance for testing
export const mockSocket = new MockSocket();

// Mock io function
export const mockIo = jest.fn(() => mockSocket);

// Reset function for tests
export const resetMockSocket = () => {
  mockSocket.removeAllListeners();
  mockSocket.connected = false;
};

// Helper to simulate server events
export const simulateServerEvent = (event: string, data: unknown) => {
  mockSocket.emit(event, data);
};

// Socket event types for type safety
export interface CartEvents {
  cart_updated: { itemId: string; action: string };
  cart_item_added: { id: string; productId: string; quantity: number };
  cart_item_updated: { id: string; quantity: number };
  cart_item_removed: { itemId: string };
  cart_cleared: { count: number };
}

export interface AuctionEvents {
  auction_bid_placed: { auctionId: string; bid: { amount: number; userId: string } };
  auction_ended: { auctionId: string; winnerId: string };
  auction_started: { auctionId: string };
}

export interface NegotiationEvents {
  negotiation_offer: { negotiationId: string; price: number };
  negotiation_accepted: { negotiationId: string };
  negotiation_rejected: { negotiationId: string };
  negotiation_counter: { negotiationId: string; price: number };
}

export interface MessageEvents {
  new_message: { conversationId: string; message: { id: string; content: string } };
  message_read: { messageId: string };
  typing_start: { conversationId: string; userId: string };
  typing_stop: { conversationId: string; userId: string };
}

// Typed event simulators
export const simulateCartEvent = <K extends keyof CartEvents>(
  event: K,
  data: CartEvents[K]
) => {
  simulateServerEvent(event, data);
};

export const simulateAuctionEvent = <K extends keyof AuctionEvents>(
  event: K,
  data: AuctionEvents[K]
) => {
  simulateServerEvent(event, data);
};

export const simulateNegotiationEvent = <K extends keyof NegotiationEvents>(
  event: K,
  data: NegotiationEvents[K]
) => {
  simulateServerEvent(event, data);
};

export const simulateMessageEvent = <K extends keyof MessageEvents>(
  event: K,
  data: MessageEvents[K]
) => {
  simulateServerEvent(event, data);
};

// Jest mock setup
export const setupSocketMock = () => {
  jest.mock('socket.io-client', () => ({
    __esModule: true,
    default: mockIo,
    io: mockIo,
  }));
};

export default mockSocket;

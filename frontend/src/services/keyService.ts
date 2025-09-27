import { 
  generateEncryptionKey, 
  generateRSAKeyPair, 
  exportPublicKey, 
  importPublicKey,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
  generateSecurePassword,
  EncryptionKey,
  KeyExchangeData
} from '../utils/encryption';

/**
 * Key Management Service
 * Handles encryption key generation, storage, and exchange
 */

export interface UserKeyPair {
  publicKey: string;
  privateKey: CryptoKey;
  keyId: string;
  createdAt: number;
}

export interface ConversationKey {
  conversationId: string;
  aesKey: string;
  keyId: string;
  participants: string[];
  createdAt: number;
}

export interface KeyExchangeRequest {
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  encryptedAESKey: string;
  keyId: string;
  timestamp: number;
}

class KeyService {
  private userKeyPair: UserKeyPair | null = null;
  private conversationKeys: Map<string, ConversationKey> = new Map();
  private pendingKeyExchanges: Map<string, KeyExchangeRequest> = new Map();

  /**
   * Initialize user's RSA key pair
   */
  async initializeUserKeys(): Promise<UserKeyPair> {
    try {
      const keyPair = await generateRSAKeyPair();
      const publicKeyString = await exportPublicKey(keyPair.publicKey);
      const keyId = generateSecurePassword();
      
      this.userKeyPair = {
        publicKey: publicKeyString,
        privateKey: keyPair.privateKey,
        keyId,
        createdAt: Date.now()
      };

      // Store in localStorage for persistence
      localStorage.setItem('userKeyPair', JSON.stringify({
        publicKey: publicKeyString,
        keyId,
        createdAt: this.userKeyPair.createdAt
      }));

      return this.userKeyPair;
    } catch (error) {
      console.error('Failed to initialize user keys:', error);
      throw new Error('Failed to initialize encryption keys');
    }
  }

  /**
   * Get user's public key
   */
  getUserPublicKey(): string | null {
    return this.userKeyPair?.publicKey || null;
  }

  /**
   * Get user's private key
   */
  getUserPrivateKey(): CryptoKey | null {
    return this.userKeyPair?.privateKey || null;
  }

  /**
   * Generate conversation-specific AES key
   */
  generateConversationKey(conversationId: string, participants: string[]): ConversationKey {
    const encryptionKey = generateEncryptionKey();
    const keyId = generateSecurePassword();
    
    const conversationKey: ConversationKey = {
      conversationId,
      aesKey: encryptionKey.key,
      keyId,
      participants,
      createdAt: Date.now()
    };

    this.conversationKeys.set(conversationId, conversationKey);
    
    // Store in localStorage
    this.saveConversationKey(conversationKey);
    
    return conversationKey;
  }

  /**
   * Get conversation key
   */
  getConversationKey(conversationId: string): ConversationKey | null {
    return this.conversationKeys.get(conversationId) || null;
  }

  /**
   * Exchange keys with another user
   */
  async exchangeKeys(
    toUserId: string, 
    conversationId: string, 
    recipientPublicKey: string
  ): Promise<KeyExchangeRequest> {
    try {
      if (!this.userKeyPair) {
        throw new Error('User keys not initialized');
      }

      const conversationKey = this.getConversationKey(conversationId);
      if (!conversationKey) {
        throw new Error('Conversation key not found');
      }

      // Import recipient's public key
      const recipientKey = await importPublicKey(recipientPublicKey);
      
      // Encrypt our AES key with recipient's public key
      const encryptedAESKey = await encryptAESKeyWithRSA(
        conversationKey.aesKey, 
        recipientKey
      );

      const keyExchange: KeyExchangeRequest = {
        fromUserId: this.userKeyPair.keyId,
        toUserId,
        conversationId,
        encryptedAESKey,
        keyId: conversationKey.keyId,
        timestamp: Date.now()
      };

      this.pendingKeyExchanges.set(conversationId, keyExchange);
      return keyExchange;
    } catch (error) {
      console.error('Key exchange error:', error);
      throw new Error('Failed to exchange keys');
    }
  }

  /**
   * Process incoming key exchange
   */
  async processKeyExchange(keyExchange: KeyExchangeRequest): Promise<ConversationKey> {
    try {
      if (!this.userKeyPair) {
        throw new Error('User keys not initialized');
      }

      // Decrypt the AES key with our private key
      const aesKey = await decryptAESKeyWithRSA(
        keyExchange.encryptedAESKey, 
        this.userKeyPair.privateKey
      );

      const conversationKey: ConversationKey = {
        conversationId: keyExchange.conversationId,
        aesKey,
        keyId: keyExchange.keyId,
        participants: [keyExchange.fromUserId, this.userKeyPair.keyId],
        createdAt: keyExchange.timestamp
      };

      this.conversationKeys.set(keyExchange.conversationId, conversationKey);
      this.saveConversationKey(conversationKey);

      return conversationKey;
    } catch (error) {
      console.error('Key exchange processing error:', error);
      throw new Error('Failed to process key exchange');
    }
  }

  /**
   * Save conversation key to localStorage
   */
  private saveConversationKey(conversationKey: ConversationKey): void {
    try {
      const existingKeys = this.getStoredConversationKeys();
      existingKeys[conversationKey.conversationId] = conversationKey;
      localStorage.setItem('conversationKeys', JSON.stringify(existingKeys));
    } catch (error) {
      console.error('Failed to save conversation key:', error);
    }
  }

  /**
   * Get stored conversation keys from localStorage
   */
  private getStoredConversationKeys(): Record<string, ConversationKey> {
    try {
      const stored = localStorage.getItem('conversationKeys');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load conversation keys:', error);
      return {};
    }
  }

  /**
   * Load conversation keys from localStorage
   */
  loadStoredKeys(): void {
    try {
      const storedKeys = this.getStoredConversationKeys();
      Object.values(storedKeys).forEach(key => {
        this.conversationKeys.set(key.conversationId, key);
      });
    } catch (error) {
      console.error('Failed to load stored keys:', error);
    }
  }

  /**
   * Check if conversation has encryption enabled
   */
  isConversationEncrypted(conversationId: string): boolean {
    return this.conversationKeys.has(conversationId);
  }

  /**
   * Remove conversation key
   */
  removeConversationKey(conversationId: string): void {
    this.conversationKeys.delete(conversationId);
    
    // Remove from localStorage
    const storedKeys = this.getStoredConversationKeys();
    delete storedKeys[conversationId];
    localStorage.setItem('conversationKeys', JSON.stringify(storedKeys));
  }

  /**
   * Clear all keys (for logout)
   */
  clearAllKeys(): void {
    this.userKeyPair = null;
    this.conversationKeys.clear();
    this.pendingKeyExchanges.clear();
    
    // Clear localStorage
    localStorage.removeItem('userKeyPair');
    localStorage.removeItem('conversationKeys');
  }

  /**
   * Get encryption status for a conversation
   */
  getEncryptionStatus(conversationId: string): {
    isEncrypted: boolean;
    keyId?: string;
    participants?: string[];
  } {
    const key = this.conversationKeys.get(conversationId);
    return {
      isEncrypted: !!key,
      keyId: key?.keyId,
      participants: key?.participants
    };
  }
}

// Export singleton instance
export const keyService = new KeyService();
export default keyService;

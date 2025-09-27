import { 
  encryptMessage, 
  decryptMessage, 
  generateEncryptionKey,
  EncryptionKey,
  EncryptedMessage 
} from '../utils/encryption';
import { keyService } from './keyService';
import { messagesAPI } from './api';
import { logger } from '../utils/logger';

/**
 * Encrypted Messaging Service
 * Handles end-to-end encrypted messaging functionality
 */

export interface EncryptedMessageData {
  content: string;
  iv: string;
  tag: string;
  keyId: string;
  keyExchangeId?: string;
}

export interface SendEncryptedMessageParams {
  conversationId: string;
  content: string;
  messageType?: string;
}

export interface DecryptedMessage {
  id: string;
  content: string;
  isEncrypted: boolean;
  senderId: string;
  createdAt: string;
  encryptionStatus?: {
    keyId?: string;
    isDecrypted: boolean;
  };
}

class EncryptedMessageService {
  /**
   * Send an encrypted message
   */
  async sendEncryptedMessage(params: SendEncryptedMessageParams): Promise<any> {
    try {
      const { conversationId, content, messageType = 'TEXT' } = params;
      
      // Check if conversation has encryption enabled
      const encryptionStatus = await this.getConversationEncryptionStatus(conversationId);
      
      if (!encryptionStatus.isEncrypted) {
        throw new Error('Conversation is not encrypted. Please enable encryption first.');
      }

      // Get conversation key
      const conversationKey = keyService.getConversationKey(conversationId);
      if (!conversationKey) {
        throw new Error('Conversation key not found. Please re-establish encryption.');
      }

      // Encrypt the message
      const encryptedMessage = encryptMessage(
        content,
        conversationKey.aesKey,
        generateEncryptionKey().iv
      );

      // Prepare encrypted message data
      const encryptedData: EncryptedMessageData = {
        content: encryptedMessage.content,
        iv: encryptedMessage.iv,
        tag: encryptedMessage.tag,
        keyId: encryptedMessage.keyId,
        keyExchangeId: conversationKey.keyId,
      };

      // Send encrypted message via API
      const response = await messagesAPI.sendMessage(conversationId, {
        content: encryptedData.content,
        messageType,
        encryptionData: {
          encryptedContent: encryptedData.content,
          keyId: encryptedData.keyId,
          iv: encryptedData.iv,
          tag: encryptedData.tag,
          keyExchangeId: encryptedData.keyExchangeId,
        },
      });

      logger.info(`Encrypted message sent to conversation: ${conversationId}`);
      return response.data;
    } catch (error) {
      logger.error('Send encrypted message error:', error);
      throw error;
    }
  }

  /**
   * Decrypt a received message
   */
  async decryptReceivedMessage(message: any): Promise<DecryptedMessage> {
    try {
      if (!message.isEncrypted) {
        return {
          ...message,
          isEncrypted: false,
          encryptionStatus: {
            isDecrypted: true,
          },
        };
      }

      // Get conversation key
      const conversationKey = keyService.getConversationKey(message.conversationId);
      if (!conversationKey) {
        logger.warn(`No conversation key found for message: ${message.id}`);
        return {
          ...message,
          isEncrypted: true,
          encryptionStatus: {
            keyId: message.encryptionKeyId,
            isDecrypted: false,
          },
        };
      }

      // Decrypt the message
      const decryptedContent = decryptMessage(
        {
          content: message.encryptedContent || message.content,
          iv: message.iv,
          tag: message.tag,
          keyId: message.encryptionKeyId,
        },
        conversationKey.aesKey
      );

      return {
        ...message,
        content: decryptedContent,
        isEncrypted: true,
        encryptionStatus: {
          keyId: message.encryptionKeyId,
          isDecrypted: true,
        },
      };
    } catch (error) {
      logger.error('Decrypt message error:', error);
      return {
        ...message,
        isEncrypted: true,
        encryptionStatus: {
          keyId: message.encryptionKeyId,
          isDecrypted: false,
        },
      };
    }
  }

  /**
   * Enable encryption for a conversation
   */
  async enableConversationEncryption(conversationId: string, participants: string[]): Promise<any> {
    try {
      // Initialize user keys if not already done
      if (!keyService.getUserPublicKey()) {
        await keyService.initializeUserKeys();
      }

      // Generate conversation key
      const conversationKey = keyService.generateConversationKey(conversationId, participants);

      // Get user's public key
      const publicKey = keyService.getUserPublicKey();
      if (!publicKey) {
        throw new Error('User public key not available');
      }

      // For now, we'll store the key locally and handle key exchange later
      // In a real implementation, you'd exchange keys with other participants
      logger.info(`Encryption enabled for conversation: ${conversationId}`);
      
      return {
        success: true,
        keyId: conversationKey.keyId,
        participants: conversationKey.participants,
      };
    } catch (error) {
      logger.error('Enable conversation encryption error:', error);
      throw error;
    }
  }

  /**
   * Get conversation encryption status
   */
  async getConversationEncryptionStatus(conversationId: string): Promise<{
    isEncrypted: boolean;
    keyId?: string;
    lastExchange?: string;
  }> {
    try {
      // Check local key service first
      const localStatus = keyService.getEncryptionStatus(conversationId);
      
      if (localStatus.isEncrypted) {
        return localStatus;
      }

      // Check server status
      const response = await messagesAPI.getEncryptionStatus(conversationId);
      return response.data.data;
    } catch (error) {
      logger.error('Get encryption status error:', error);
      return { isEncrypted: false };
    }
  }

  /**
   * Process pending key exchanges
   */
  async processPendingKeyExchanges(): Promise<any[]> {
    try {
      const response = await messagesAPI.getPendingKeyExchanges();
      const keyExchanges = response.data.data;

      for (const keyExchange of keyExchanges) {
        try {
          // Process the key exchange
          await keyService.processKeyExchange(keyExchange);
          
          // Mark as processed on server
          await messagesAPI.processKeyExchange(keyExchange.id, { status: 'PROCESSED' });
          
          logger.info(`Key exchange processed: ${keyExchange.id}`);
        } catch (error) {
          logger.error(`Failed to process key exchange ${keyExchange.id}:`, error);
          // Mark as failed
          await messagesAPI.processKeyExchange(keyExchange.id, { status: 'FAILED' });
        }
      }

      return keyExchanges;
    } catch (error) {
      logger.error('Process pending key exchanges error:', error);
      throw error;
    }
  }

  /**
   * Check if message can be decrypted
   */
  canDecryptMessage(message: any): boolean {
    if (!message.isEncrypted) {
      return true;
    }

    const conversationKey = keyService.getConversationKey(message.conversationId);
    return !!conversationKey;
  }

  /**
   * Get encryption status for a message
   */
  getMessageEncryptionStatus(message: any): {
    isEncrypted: boolean;
    canDecrypt: boolean;
    keyId?: string;
  } {
    return {
      isEncrypted: message.isEncrypted || false,
      canDecrypt: this.canDecryptMessage(message),
      keyId: message.encryptionKeyId,
    };
  }

  /**
   * Clear encryption keys (for logout)
   */
  clearEncryptionKeys(): void {
    keyService.clearAllKeys();
    logger.info('Encryption keys cleared');
  }
}

// Export singleton instance
export const encryptedMessageService = new EncryptedMessageService();
export default encryptedMessageService;

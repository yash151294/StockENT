import CryptoJS from 'crypto-js';

/**
 * End-to-End Encryption Utilities
 * Implements AES-256-CBC encryption for secure messaging
 */

export interface EncryptionKey {
  key: string;
  salt: string;
  iv: string;
}

export interface EncryptedMessage {
  content: string;
  iv: string;
  tag: string;
  keyId: string;
}

export interface KeyExchangeData {
  publicKey: string;
  keyId: string;
  timestamp: number;
}

/**
 * Generate a random encryption key
 */
export const generateEncryptionKey = (): EncryptionKey => {
  const key = CryptoJS.lib.WordArray.random(32).toString();
  const salt = CryptoJS.lib.WordArray.random(16).toString();
  const iv = CryptoJS.lib.WordArray.random(12).toString();
  
  return { key, salt, iv };
};

/**
 * Derive encryption key from password using PBKDF2
 */
export const deriveKey = (password: string, salt: string): string => {
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  });
  return key.toString();
};

/**
 * Encrypt message content using AES-256-CBC
 */
export const encryptMessage = (
  content: string, 
  key: string, 
  iv: string
): EncryptedMessage => {
  try {
    // Generate random IV if not provided
    const messageIv = iv || CryptoJS.lib.WordArray.random(12).toString();
    
    // Encrypt the message
    const encrypted = CryptoJS.AES.encrypt(content, key, {
      iv: CryptoJS.enc.Hex.parse(messageIv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      content: encrypted.toString(),
      iv: messageIv,
      tag: '', // CBC mode with PKCS7 padding
      keyId: generateKeyId()
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt message content using AES-256-CBC
 */
export const decryptMessage = (
  encryptedMessage: EncryptedMessage, 
  key: string
): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage.content, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedMessage.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }
    
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Generate a unique key ID
 */
export const generateKeyId = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

/**
 * Generate RSA key pair for key exchange
 */
export const generateRSAKeyPair = async (): Promise<CryptoKeyPair> => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    return keyPair;
  } catch (error) {
    console.error('RSA key generation error:', error);
    throw new Error('Failed to generate RSA key pair');
  }
};

/**
 * Export public key to string
 */
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  try {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    const exportedAsString = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return exportedAsString;
  } catch (error) {
    console.error('Public key export error:', error);
    throw new Error('Failed to export public key');
  }
};

/**
 * Import public key from string
 */
export const importPublicKey = async (publicKeyString: string): Promise<CryptoKey> => {
  try {
    const keyData = Uint8Array.from(atob(publicKeyString), c => c.charCodeAt(0));
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
    return publicKey;
  } catch (error) {
    console.error('Public key import error:', error);
    throw new Error('Failed to import public key');
  }
};

/**
 * Encrypt AES key with RSA public key
 */
export const encryptAESKeyWithRSA = async (
  aesKey: string, 
  publicKey: CryptoKey
): Promise<string> => {
  try {
    const keyData = new TextEncoder().encode(aesKey);
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      keyData
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (error) {
    console.error('AES key encryption error:', error);
    throw new Error('Failed to encrypt AES key');
  }
};

/**
 * Decrypt AES key with RSA private key
 */
export const decryptAESKeyWithRSA = async (
  encryptedAESKey: string, 
  privateKey: CryptoKey
): Promise<string> => {
  try {
    const encryptedData = Uint8Array.from(atob(encryptedAESKey), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedData
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('AES key decryption error:', error);
    throw new Error('Failed to decrypt AES key');
  }
};

/**
 * Generate a secure random password for key derivation
 */
export const generateSecurePassword = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash a string using SHA-256
 */
export const hashString = (input: string): string => {
  return CryptoJS.SHA256(input).toString();
};

/**
 * Verify message integrity
 */
export const verifyMessageIntegrity = (
  message: string, 
  hash: string
): boolean => {
  const messageHash = hashString(message);
  return messageHash === hash;
};

/**
 * Create message signature
 */
export const signMessage = (message: string, privateKey: string): string => {
  return CryptoJS.HmacSHA256(message, privateKey).toString();
};

/**
 * Verify message signature
 */
export const verifyMessageSignature = (
  message: string, 
  signature: string, 
  publicKey: string
): boolean => {
  const expectedSignature = signMessage(message, publicKey);
  return expectedSignature === signature;
};

import CryptoJS from 'crypto-js';
import 'react-native-get-random-values';

// In a real production environment, this key should be managed securely,
// potentially retrieved from a server or derived from user credentials.
// For this "Data At Rest" phase, we use an environment variable or a generated fallback.

const STORAGE_KEY_NAME = 'my_compass_sec_key';

const getEncryptionKey = (): string => {
  // 1. Try environment variable
  if (process.env.EXPO_PUBLIC_STORAGE_KEY) {
    return process.env.EXPO_PUBLIC_STORAGE_KEY;
  }

  // 2. Try to retrieve generated key from localStorage (Web)
  if (typeof localStorage !== 'undefined') {
    const storedKey = localStorage.getItem(STORAGE_KEY_NAME);
    if (storedKey) {
      return storedKey;
    }

    // 3. Generate a new random key
    const newKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
    try {
      localStorage.setItem(STORAGE_KEY_NAME, newKey);
      return newKey;
    } catch (e) {
      console.error('Failed to save encryption key to localStorage:', e);
      // Fallback for when storage is full or disabled - better than crashing, 
      // but effectively means data won't persist encrypted across reloads if we can't save the key.
      // Returning the generated key at least allows the current session to work.
      return newKey;
    }
  }

  // Fallback for non-web environments without env var (unlikely in this context but safe)
  return 'fallback-session-key-' + new Date().getTime();
};

// Initialize key once
const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypts a string using AES.
 * @param data The plaintext string to encrypt.
 * @returns The encrypted string.
 */
export const encryptData = (data: string): string => {
  // Encryption disabled for dev phase as per user request
  return data;
  // if (!data) return data;
  // return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Decrypts a string using AES.
 * If decryption fails (e.g. invalid key or data is not encrypted),
 * it returns the original string to support migration from plain text.
 * @param data The encrypted string (or potential plaintext).
 * @returns The decrypted string.
 */
export const decryptData = (data: string): string => {
  return data;
  // if (!data) return data;
  // try {
  //   const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
  //   const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  //   if (!decrypted) {
  //     return data;
  //   }
  //   return decrypted;
  // } catch (error) {
  //   return data;
  // }
};

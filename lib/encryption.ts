import CryptoJS from 'crypto-js';

// In a real production environment, this key should be managed securely,
// potentially retrieved from a server or derived from user credentials.
// For this "Data At Rest" phase, we use an environment variable or a fallback.
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_STORAGE_KEY || 'my-compass-insecure-default-key-change-me';

/**
 * Encrypts a string using AES.
 * @param data The plaintext string to encrypt.
 * @returns The encrypted string.
 */
export const encryptData = (data: string): string => {
  if (!data) return data;
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Decrypts a string using AES.
 * If decryption fails (e.g. invalid key or data is not encrypted),
 * it returns the original string to support migration from plain text.
 * @param data The encrypted string (or potential plaintext).
 * @returns The decrypted string.
 */
export const decryptData = (data: string): string => {
  if (!data) return data;
  try {
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption results in an empty string but input was not empty,
    // it likely failed (wrong key or not encrypted).
    // However, empty string is valid plaintext.
    // Usually invalid decryption yields malformed UTF8 or empty string.
    // Given we store JSON, we expect a valid string.
    if (!decrypted) {
        // Fallback: assume it was plain text
        return data;
    }
    return decrypted;
  } catch (error) {
    // If it crashes, return original data (likely plain text)
    return data;
  }
};

/**
 * Secure cryptographic hashing helper for 68Share.
 * Utilizes the browser's native subtle-crypto Web API for SHA-256 hashing.
 */

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  return crypto.randomUUID();
}

import CryptoJS from 'crypto-js';

export function signRequestPayload(secret: string, payload: string): string {
  return CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);
}

export function buildHmacPayload(
  timestamp: number,
  method: string,
  path: string,
  body: unknown,
): string {
  const normalizedMethod = method.toUpperCase();
  const bodyString =
    body == null || body === ''
      ? ''
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  return `${timestamp}.${normalizedMethod}.${path}.${bodyString}`;
}

export function hashActivationToken(token: string): string {
  return CryptoJS.SHA256(token).toString(CryptoJS.enc.Hex);
}

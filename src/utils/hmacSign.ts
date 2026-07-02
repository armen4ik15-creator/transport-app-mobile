import CryptoJS from 'crypto-js';

export function signRequestPayload(secret: string, payload: string): string {
  return CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);
}

export function serializeBodyForSigning(body: unknown): string {
  if (body == null || body === '') return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 0) {
    return '';
  }
  return JSON.stringify(body);
}

export function buildHmacPayload(
  timestamp: number,
  method: string,
  path: string,
  body: unknown,
): string {
  const normalizedMethod = method.toUpperCase();
  const bodyString = serializeBodyForSigning(body);
  return `${timestamp}.${normalizedMethod}.${path}.${bodyString}`;
}

export function extractSigningPath(requestUrl: string): string {
  try {
    return new URL(requestUrl).pathname;
  } catch {
    const withoutQuery = requestUrl.split('?')[0] ?? requestUrl;
    const match = withoutQuery.match(/\/api(\/.*)?$/i);
    if (match) {
      return match[0].startsWith('/api') ? match[0] : `/api${match[0]}`;
    }
    return withoutQuery.startsWith('/api') ? withoutQuery : `/api${withoutQuery}`;
  }
}

export function hashActivationToken(token: string): string {
  return CryptoJS.SHA256(token).toString(CryptoJS.enc.Hex);
}

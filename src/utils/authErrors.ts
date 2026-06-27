import { isHttpError } from '../api/client';

const SERVER_UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

/** Сетевая ошибка или сервер недоступен — токен не трогаем, сессию не сбрасываем */
export function isNetworkAuthError(err: unknown): boolean {
  if (!isHttpError(err)) return false;
  if (!err.response) return true;
  if (err.code === 'ECONNABORTED') return true;
  if (err.message === 'Network Error') return true;
  if (err.response.status != null && SERVER_UNAVAILABLE_STATUSES.has(err.response.status)) {
    return true;
  }
  return false;
}

export function isUnauthorizedError(err: unknown): boolean {
  return isHttpError(err) && err.response?.status === 401;
}

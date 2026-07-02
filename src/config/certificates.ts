/**
 * SHA-256 pin hashes for SSL certificate pinning (OkHttp CertificatePinner).
 *
 * Получить hash для вашего сервера:
 * openssl s_client -connect armen4ik15-creator-transport-app-server-26b3.twc1.net:443 -servername armen4ik15-creator-transport-app-server-26b3.twc1.net </dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 *
 * Или для leaf-сертификата:
 * echo | openssl s_client -connect HOST:443 2>/dev/null | openssl x509 -outform DER | openssl dgst -sha256 -binary | base64
 */
export const PINNED_CERTS = {
  host: 'armen4ik15-creator-transport-app-server-26b3.twc1.net',
  /** Замените на реальный pin после openssl-команды выше */
  sha256Pins: [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ],
  wildcardHost: '*.twc1.net',
} as const;

export const SSL_PINNING_DOCS = `
openssl s_client -connect armen4ik15-creator-transport-app-server-26b3.twc1.net:443 -servername armen4ik15-creator-transport-app-server-26b3.twc1.net </dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
`.trim();

package com.reestrpro.mobile

/**
 * SHA-256 pins for twc1.net production API.
 *
 * Обновите PLACEHOLDER после команды:
 * openssl s_client -connect armen4ik15-creator-transport-app-server-26b3.twc1.net:443 -servername armen4ik15-creator-transport-app-server-26b3.twc1.net </dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 */
object Twc1CertificatePins {
  const val HOST = "armen4ik15-creator-transport-app-server-26b3.twc1.net"
  const val WILDCARD_HOST = "*.twc1.net"

  val SHA256_PINS: Array<String> = arrayOf(
    "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  )
}

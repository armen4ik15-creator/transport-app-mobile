package com.reestrpro.mobile

import okhttp3.Dns
import org.json.JSONObject
import java.net.InetAddress
import java.net.URL
import java.net.UnknownHostException
import javax.net.ssl.HttpsURLConnection

/**
 * Если DNS оператора/Private DNS не резолвит twc1.net — пробуем Google DNS over HTTPS и статический IP.
 */
object Twc1FallbackDns : Dns {
  private val STATIC_FALLBACK = mapOf(
    "armen4ik15-creator-transport-app-server-26b3.twc1.net" to "201.51.5.169",
  )

  override fun lookup(hostname: String): List<InetAddress> {
    try {
      return Dns.SYSTEM.lookup(hostname)
    } catch (systemError: UnknownHostException) {
      resolveViaGoogleDns(hostname)?.let { ip ->
        return listOf(InetAddress.getByName(ip))
      }

      STATIC_FALLBACK[hostname.lowercase()]?.let { ip ->
        return listOf(InetAddress.getByName(ip))
      }

      throw systemError
    }
  }

  private fun resolveViaGoogleDns(hostname: String): String? {
    return try {
      val url = URL("https://dns.google/resolve?name=$hostname&type=A")
      val connection = url.openConnection() as HttpsURLConnection
      connection.connectTimeout = 4000
      connection.readTimeout = 4000
      connection.requestMethod = "GET"

      connection.inputStream.bufferedReader().use { reader ->
        val body = reader.readText()
        val json = JSONObject(body)
        val answer = json.optJSONArray("Answer") ?: return null
        for (index in 0 until answer.length()) {
          val record = answer.getJSONObject(index)
          if (record.optInt("type") == 1) {
            return record.optString("data").takeIf { it.isNotBlank() }
          }
        }
        null
      }
    } catch (_: Exception) {
      null
    }
  }
}

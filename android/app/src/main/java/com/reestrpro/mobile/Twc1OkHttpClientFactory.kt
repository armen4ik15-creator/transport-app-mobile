package com.reestrpro.mobile

import android.content.Context
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.CertificatePinner
import okhttp3.ConnectionPool
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Единый OkHttp для React Native и expo-file-system:
 * DNS fallback, SSL chain fix, keep-alive pool (без Connection: close).
 */
class Twc1OkHttpClientFactory(
  private val context: Context,
) : OkHttpClientFactory {

  private val sslContextPair by lazy { Twc1SslSupport.createSslContext(context) }

  override fun createNewNetworkModuleClient(): OkHttpClient {
    val (sslContext, trustManager) = sslContextPair
    val builder = OkHttpClientProvider.createClientBuilder(context)
      .dns(Twc1FallbackDns)
      .sslSocketFactory(sslContext.socketFactory, trustManager)

    val hasRealPins = Twc1CertificatePins.SHA256_PINS.any { pin ->
      !pin.contains("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    }
    if (hasRealPins) {
      val pinnerBuilder = CertificatePinner.Builder()
      Twc1CertificatePins.SHA256_PINS.forEach { pin ->
        pinnerBuilder.add(Twc1CertificatePins.HOST, pin)
        pinnerBuilder.add(Twc1CertificatePins.WILDCARD_HOST, pin)
      }
      builder.certificatePinner(pinnerBuilder.build())
    }

    return builder
      .retryOnConnectionFailure(true)
      .connectTimeout(20, TimeUnit.SECONDS)
      .readTimeout(20, TimeUnit.SECONDS)
      .writeTimeout(20, TimeUnit.SECONDS)
      .connectionPool(ConnectionPool(8, 5, TimeUnit.MINUTES))
      .addInterceptor { chain ->
        val request = chain.request().newBuilder()
          .header("User-Agent", "ReestrPro/1.5.0 Android")
          .header("Accept", "application/json")
          .build()
        chain.proceed(request)
      }
      .build()
  }
}

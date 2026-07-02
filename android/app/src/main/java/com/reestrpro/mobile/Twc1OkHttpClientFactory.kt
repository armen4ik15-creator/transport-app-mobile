package com.reestrpro.mobile

import android.content.Context
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.OkHttpClient
import okhttp3.Protocol

class Twc1OkHttpClientFactory(
  private val context: Context,
) : OkHttpClientFactory {

  private val sslContextPair by lazy { Twc1SslSupport.createSslContext(context) }

  override fun createNewNetworkModuleClient(): OkHttpClient {
    val (sslContext, trustManager) = sslContextPair
    return OkHttpClientProvider.createClientBuilder(context)
      .dns(Twc1FallbackDns)
      .sslSocketFactory(sslContext.socketFactory, trustManager)
      .protocols(listOf(Protocol.HTTP_1_1))
      .retryOnConnectionFailure(true)
      .build()
  }
}

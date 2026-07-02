package com.reestrpro.mobile

import android.content.Context
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.OkHttpClient
import okhttp3.Protocol
import java.util.concurrent.TimeUnit

class Twc1OkHttpClientFactory(
  private val context: Context,
) : OkHttpClientFactory {

  override fun createNewNetworkModuleClient(): OkHttpClient {
    return OkHttpClientProvider.createClientBuilder(context)
      .dns(Twc1FallbackDns)
      .protocols(listOf(Protocol.HTTP_1_1))
      .retryOnConnectionFailure(true)
      .connectTimeout(30, TimeUnit.SECONDS)
      .readTimeout(30, TimeUnit.SECONDS)
      .writeTimeout(30, TimeUnit.SECONDS)
      .addInterceptor { chain ->
        val request = chain.request().newBuilder()
          .header("User-Agent", "ReestrPro/1.4.2 Android")
          .header("Connection", "close")
          .build()
        chain.proceed(request)
      }
      .build()
  }
}

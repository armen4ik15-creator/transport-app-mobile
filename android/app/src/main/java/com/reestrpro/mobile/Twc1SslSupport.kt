package com.reestrpro.mobile

import android.content.Context
import java.security.cert.CertificateException
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

object Twc1SslSupport {
  private val supplementalCertResourceIds = intArrayOf(
    R.raw.globalsign_gcc_r3_dv_tls_ca_2020,
    R.raw.globalsign_root_r3,
  )

  fun createSslContext(context: Context): Pair<SSLContext, X509TrustManager> {
    val supplementalCerts = loadSupplementalCertificates(context)
    val systemTrustManager = defaultSystemTrustManager()
    val trustManager = IncompleteChainTrustManager(systemTrustManager, supplementalCerts)

    val sslContext = SSLContext.getInstance("TLS")
    sslContext.init(null, arrayOf(trustManager), null)
    return Pair(sslContext, trustManager)
  }

  private fun defaultSystemTrustManager(): X509TrustManager {
    val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    trustManagerFactory.init(null as java.security.KeyStore?)
    return trustManagerFactory.trustManagers
      .filterIsInstance<X509TrustManager>()
      .first()
  }

  private fun loadSupplementalCertificates(context: Context): Array<X509Certificate> {
    val certificateFactory = CertificateFactory.getInstance("X.509")
    return supplementalCertResourceIds.map { resourceId ->
      context.resources.openRawResource(resourceId).use { inputStream ->
        certificateFactory.generateCertificate(inputStream) as X509Certificate
      }
    }.toTypedArray()
  }

  private class IncompleteChainTrustManager(
    private val delegate: X509TrustManager,
    private val supplementalCerts: Array<X509Certificate>,
  ) : X509TrustManager {

    override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {
      delegate.checkClientTrusted(chain, authType)
    }

    override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {
      try {
        delegate.checkServerTrusted(chain, authType)
      } catch (primaryError: CertificateException) {
        val augmentedChains = buildAugmentedChains(chain)
        var lastError: CertificateException = primaryError

        for (augmentedChain in augmentedChains) {
          try {
            delegate.checkServerTrusted(augmentedChain, authType)
            return
          } catch (retryError: CertificateException) {
            lastError = retryError
          }
        }

        val leaf = chain?.firstOrNull()
        if (leaf != null && isTwc1Certificate(leaf)) {
          leaf.checkValidity()
          return
        }

        throw lastError
      }
    }

    private fun isTwc1Certificate(certificate: X509Certificate): Boolean {
      val subject = certificate.subjectX500Principal.name.lowercase()
      if (subject.contains("twc1.net")) return true

      return try {
        certificate.subjectAlternativeNames.orEmpty().any { entry ->
          val value = entry.getOrNull(1)?.toString()?.lowercase().orEmpty()
          value.endsWith(".twc1.net") || value == "twc1.net"
        }
      } catch (_: CertificateException) {
        false
      }
    }

    override fun getAcceptedIssuers(): Array<X509Certificate> {
      return (delegate.acceptedIssuers.toList() + supplementalCerts.toList()).toTypedArray()
    }

    private fun buildAugmentedChains(chain: Array<out X509Certificate>?): List<Array<X509Certificate>> {
      val serverChain = chain?.toList().orEmpty()
      if (serverChain.isEmpty()) {
        return listOf(supplementalCerts)
      }

      val chains = mutableListOf<Array<X509Certificate>>()
      val missingSupplementalCerts = supplementalCerts.filter { supplemental ->
        serverChain.none { serverCert ->
          serverCert.subjectX500Principal == supplemental.subjectX500Principal
        }
      }

      if (missingSupplementalCerts.isNotEmpty()) {
        chains.add((serverChain + missingSupplementalCerts).toTypedArray())
      }

      for (supplementalCert in supplementalCerts) {
        if (serverChain.none { it.subjectX500Principal == supplementalCert.subjectX500Principal }) {
          chains.add((serverChain + supplementalCert).toTypedArray())
        }
      }

      return chains.distinctBy { augmentedChain ->
        augmentedChain.joinToString("|") { cert -> cert.subjectX500Principal.name }
      }
    }
  }
}

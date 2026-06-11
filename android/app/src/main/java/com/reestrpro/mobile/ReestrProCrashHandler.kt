package com.reestrpro.mobile

import android.app.Application
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Toast
import java.io.PrintWriter
import java.io.StringWriter
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

object ReestrProCrashHandler {
  const val TAG = "ReestrProCrash"
  private const val STACK_LIMIT = 2000
  private const val DIALOG_WAIT_SECONDS = 30L

  @Volatile
  private var installed = false

  private val pendingLatch = AtomicReference<CountDownLatch?>(null)

  fun takePendingLatch(): CountDownLatch? = pendingLatch.getAndSet(null)

  fun install(app: Application) {
    if (installed) return
    installed = true

    val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
      handleCrash(app, thread, throwable, defaultHandler)
    }
  }

  private fun handleCrash(
    app: Application,
    thread: Thread,
    throwable: Throwable,
    defaultHandler: Thread.UncaughtExceptionHandler?,
  ) {
    val stackTrace = formatStackTrace(throwable)
    Log.e(TAG, "Uncaught exception in thread ${thread.name}", throwable)
    writeCrashLog(app, throwable, stackTrace)

    val dialogMessage = buildString {
      append(throwable.message ?: throwable.javaClass.simpleName)
      append("\n\n")
      append(stackTrace.take(STACK_LIMIT))
    }

    val latch = CountDownLatch(1)
    pendingLatch.set(latch)

    val showDialog = Runnable {
      showCrashDialog(app, dialogMessage, latch)
    }

    // Posting to main looper from the main thread deadlocks — run inline instead.
    if (Looper.myLooper() == Looper.getMainLooper()) {
      showDialog.run()
    } else {
      Handler(Looper.getMainLooper()).post(showDialog)
    }

    try {
      latch.await(DIALOG_WAIT_SECONDS, TimeUnit.SECONDS)
    } catch (_: InterruptedException) {
      Thread.currentThread().interrupt()
    } finally {
      pendingLatch.set(null)
    }

    defaultHandler?.uncaughtException(thread, throwable)
  }

  private fun showCrashDialog(app: Application, message: String, latch: CountDownLatch) {
    try {
      val intent =
        Intent(app, CrashDialogActivity::class.java).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
          putExtra(CrashDialogActivity.EXTRA_MESSAGE, message)
        }
      app.startActivity(intent)
      return
    } catch (activityError: Exception) {
      Log.e(TAG, "Failed to launch CrashDialogActivity", activityError)
    }

    try {
      android.app.AlertDialog.Builder(app, android.R.style.Theme_DeviceDefault_Light_Dialog_Alert)
        .setTitle("ReestrPro — сбой")
        .setMessage(message)
        .setCancelable(false)
        .setPositiveButton("OK") { _, _ -> latch.countDown() }
        .setOnDismissListener { latch.countDown() }
        .show()
    } catch (dialogError: Exception) {
      Log.e(TAG, "Failed to show crash dialog", dialogError)
      try {
        Toast.makeText(app, message.take(200), Toast.LENGTH_LONG).show()
        Handler(Looper.getMainLooper()).postDelayed({ latch.countDown() }, 5000)
      } catch (toastError: Exception) {
        Log.e(TAG, "Failed to show crash toast", toastError)
        latch.countDown()
      }
    }
  }

  private fun writeCrashLog(app: Application, throwable: Throwable, stackTrace: String) {
    try {
      val payload =
        "${System.currentTimeMillis()} [${Thread.currentThread().name}] " +
          "${throwable.javaClass.name}: ${throwable.message}\n$stackTrace\n\n"
      app.openFileOutput("crash.log", android.content.Context.MODE_APPEND).use { stream ->
        stream.write(payload.toByteArray(Charsets.UTF_8))
      }
    } catch (writeError: Exception) {
      Log.e(TAG, "Failed to write crash.log", writeError)
    }
  }

  private fun formatStackTrace(throwable: Throwable): String {
    val writer = StringWriter()
    throwable.printStackTrace(PrintWriter(writer))
    return writer.toString()
  }
}

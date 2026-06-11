package com.reestrpro.mobile

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.util.Log

/**
 * Transparent activity that shows a crash dialog with a valid window token.
 * Launched from [ReestrProCrashHandler] before the process exits.
 */
class CrashDialogActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "Unknown crash"
    val latch = ReestrProCrashHandler.takePendingLatch()

    try {
      AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Light_Dialog_Alert)
        .setTitle("ReestrPro — сбой")
        .setMessage(message)
        .setCancelable(false)
        .setPositiveButton("OK") { _, _ ->
          latch?.countDown()
          finish()
        }
        .setOnDismissListener {
          latch?.countDown()
        }
        .show()
    } catch (e: Exception) {
      Log.e(ReestrProCrashHandler.TAG, "CrashDialogActivity failed", e)
      latch?.countDown()
      finish()
    }
  }

  companion object {
    const val EXTRA_MESSAGE = "crash_message"
  }
}

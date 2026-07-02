package com.reestrpro.mobile

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.os.Debug

class AntiDebugModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AntiDebugModule"

  @ReactMethod
  fun isDebuggerConnected(promise: Promise) {
    try {
      promise.resolve(Debug.isDebuggerConnected())
    } catch (error: Exception) {
      promise.resolve(false)
    }
  }
}

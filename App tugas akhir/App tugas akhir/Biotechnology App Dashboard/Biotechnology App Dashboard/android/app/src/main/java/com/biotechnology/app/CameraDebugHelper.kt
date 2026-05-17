package com.biotechnology.app

import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.util.Log
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat

object CameraDebugHelper {
    private const val TAG = "CameraDebugHelper"

    fun logCameraAvailability(context: Context) {
        try {
            val cameraPermission = ContextCompat.checkSelfPermission(
                context, 
                android.Manifest.permission.CAMERA
            )
            Log.d(TAG, "Camera permission: ${
                if (cameraPermission == PackageManager.PERMISSION_GRANTED) "GRANTED" else "DENIED"
            }")

            val pm = context.packageManager
            val hasCamera = pm.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
            Log.d(TAG, "Camera available: $hasCamera")

            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraIds = cameraManager.cameraIdList
            Log.d(TAG, "Camera count: ${cameraIds.size}")

        } catch (e: Exception) {
            Log.e(TAG, "Camera check failed", e)
        }
    }

    fun logDetailedError(error: Throwable) {
        Log.e(TAG, "${error.javaClass.simpleName}: ${error.message}")
    }
}
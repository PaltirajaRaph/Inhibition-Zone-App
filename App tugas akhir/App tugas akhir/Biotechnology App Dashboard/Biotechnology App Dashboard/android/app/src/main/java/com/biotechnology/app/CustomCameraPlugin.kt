package com.biotechnology.app

import android.Manifest
import android.content.ContentValues
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.activity.result.ActivityResult
import androidx.camera.core.*
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.sqrt

@CapacitorPlugin(
    name = "CustomCamera",
    permissions = [
        Permission(strings = [Manifest.permission.CAMERA], alias = "camera")
    ]
)
class CustomCameraPlugin : Plugin() {
    private var imageCapture: ImageCapture? = null
    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private lateinit var cameraExecutor: ExecutorService

    // Preview container and view for positioning within web-defined bounds
    private var previewContainer: FrameLayout? = null
    private var previewView: PreviewView? = null

    // Sensors for inclinometer
    private var sensorManager: SensorManager? = null
    private var accel: Sensor? = null
    private var magnet: Sensor? = null
    private var sensorListener: SensorEventListener? = null
    private var accelVals: FloatArray? = null
    private var magnetVals: FloatArray? = null
    private var inclinometerRunning = false

    // Activity results are handled using Capacitor's ActivityCallback system.

    companion object {
        private const val TAG = "CustomCameraPlugin"
        private const val FILENAME_FORMAT = "yyyy-MM-dd-HH-mm-ss-SSS"
        private const val CAPTURE_TARGET_WIDTH = 1920
        private const val CAPTURE_TARGET_HEIGHT = 1440
        private const val CAPTURE_JPEG_QUALITY = 90
        // Stability threshold (degrees). If absolute roll/pitch exceeds this, considered unstable
		private const val STABILITY_DEGREE_THRESHOLD = 15.0 // degrees
        // Smoothing factor for low-pass filter
        private const val ALPHA = 0.2f
    }

    private fun buildImageCapture(targetRotation: Int): ImageCapture {
        val resolutionSelector = ResolutionSelector.Builder()
            .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
            .setResolutionStrategy(
                ResolutionStrategy(
                    android.util.Size(CAPTURE_TARGET_WIDTH, CAPTURE_TARGET_HEIGHT),
                    ResolutionStrategy.FALLBACK_RULE_CLOSEST_LOWER_THEN_HIGHER,
                )
            )
            .build()

        return ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
            .setJpegQuality(CAPTURE_JPEG_QUALITY)
            .setTargetRotation(targetRotation)
            .setFlashMode(ImageCapture.FLASH_MODE_OFF)
            .setResolutionSelector(resolutionSelector)
            .build()
    }

    override fun load() {
        super.load()
        cameraExecutor = Executors.newSingleThreadExecutor()
        sensorManager = context.getSystemService(android.content.Context.SENSOR_SERVICE) as SensorManager
        accel = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        magnet = sensorManager?.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
    }

    /**
     * Set native preview bounds so it aligns with a web UI slot.
     * Expects x, y, width, height in pixels relative to the Activity content view.
     */
    @PluginMethod
    fun setPreviewBounds(call: PluginCall) {
        val x = call.getInt("x") ?: 0
        val y = call.getInt("y") ?: 0
        val width = call.getInt("width") ?: 0
        val height = call.getInt("height") ?: 0

        try {
            val activity = activity
            if (activity == null) {
                call.reject("Activity not available")
                return
            }

            // Create container if not exists
            if (previewContainer == null) {
                previewContainer = FrameLayout(activity).apply {
                    isClickable = false
                    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
                    // Transparent background so web UI below/around remains visible
                    setBackgroundColor(0x00000000)
                }

                // Add to root content view
                val root = activity.findViewById<ViewGroup>(android.R.id.content)
                root.addView(previewContainer)
            }

            // Layout the container to specified bounds
            previewContainer?.let { container ->
                val params = FrameLayout.LayoutParams(width, height)
                params.leftMargin = x
                params.topMargin = y
                container.layoutParams = params
                container.requestLayout()
            }

            // Emit bounds info for diagnostics
            notifyListeners("previewBoundsSet", JSObject().apply {
                put("x", x); put("y", y); put("width", width); put("height", height)
                put("valid", (width > 0 && height > 0))
            })

            val ret = JSObject()
            ret.put("success", true)
            ret.put("message", "Preview bounds set")
            call.resolve(ret)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting preview bounds", e)
            call.reject("Error setting preview bounds: ${e.message}", e)
        }
    }

    @PluginMethod
    fun startCamera(call: PluginCall) {
        if (!checkCameraPermission()) {
            call.reject("Camera permissions not granted")
            return
        }

        val activity = activity
        if (activity == null) {
            call.reject("Activity not available")
            return
        }

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                // Ensure container exists; if bounds not set (size 0), fallback to full-screen
                val root = activity.findViewById<ViewGroup>(android.R.id.content)
                if (previewContainer == null) {
                    previewContainer = FrameLayout(activity).apply {
                        isClickable = false
                        setBackgroundColor(0x00000000)
                    }
                    root.addView(previewContainer)
                }
                // If current layout params are null or width/height <= 0, set to full-screen
                val currentParams = previewContainer?.layoutParams
                val needsFullscreen = (currentParams == null || currentParams.width <= 0 || currentParams.height <= 0)
                if (needsFullscreen) {
                    val fullParams = FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    previewContainer?.layoutParams = fullParams
                    previewContainer?.requestLayout()
                    notifyListeners("previewBoundsSet", JSObject().apply {
                        put("x", 0); put("y", 0); put("width", root.width); put("height", root.height)
                        put("valid", true); put("fallbackFullscreen", true)
                    })
                }

                if (previewView == null) {
                    previewView = PreviewView(activity).apply {
                        implementationMode = PreviewView.ImplementationMode.PERFORMANCE
                        scaleType = PreviewView.ScaleType.FILL_CENTER
                        isClickable = false
                        setBackgroundColor(0x00000000)
                    }
                    previewContainer?.addView(previewView, FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    ))
                }

                val preview = Preview.Builder().build()

                imageCapture = buildImageCapture(
                    previewView?.display?.rotation ?: android.view.Surface.ROTATION_0
                )

                val imageAnalyzer = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                // Connect preview to surface provider
                previewView?.let { pv ->
                    preview.setSurfaceProvider(pv.surfaceProvider)
                }

                cameraProvider?.unbindAll()

                camera = cameraProvider?.bindToLifecycle(
                    activity as androidx.lifecycle.LifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture,
                    imageAnalyzer
                )

                val ret = JSObject()
                ret.put("success", true)
                ret.put("message", "Camera initialized")
                call.resolve(ret)

                // Notify JS that camera is ready so UI can keep buttons visible
                notifyListeners("cameraReady", JSObject().apply {
                    put("ready", true)
                })
            } catch (e: Exception) {
                Log.e(TAG, "Camera initialization failed", e)
                call.reject("Camera initialization failed: ${e.message}", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    @PluginMethod
    fun takePicture(call: PluginCall) {
        val imageCapture = imageCapture ?: run {
            call.reject("Camera not initialized. Call startCamera() first.")
            return
        }
        // Notify JS capture started
        notifyListeners("captureStart", JSObject())

        val name = SimpleDateFormat(FILENAME_FORMAT, Locale.US)
            .format(System.currentTimeMillis())
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "BioLab_$name")
            put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
                put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/BioLab")
            }
        }
        val outputOptions = ImageCapture.OutputFileOptions
            .Builder(
                context.contentResolver,
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                contentValues
            )
            .build()
        imageCapture.takePicture(
            outputOptions,
            cameraExecutor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exception: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exception.message}", exception)
                    call.reject("Photo capture failed: ${exception.message}", exception)
                    notifyListeners("captureError", JSObject().apply {
                        put("message", exception.message ?: "")
                    })
                }
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    val savedUri = output.savedUri
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("path", savedUri?.toString() ?: "")
                    ret.put("uri", savedUri?.toString() ?: "")
                    call.resolve(ret)
                    notifyListeners("captureSuccess", JSObject().apply {
                        put("uri", savedUri?.toString() ?: "")
                    })
                }
            }
        )
    }

    @PluginMethod
    fun setFlashMode(call: PluginCall) {
        val flashMode = call.getString("mode", "off")
        imageCapture?.let {
            when (flashMode) {
                "on" -> it.flashMode = ImageCapture.FLASH_MODE_ON
                "auto" -> it.flashMode = ImageCapture.FLASH_MODE_AUTO
                else -> it.flashMode = ImageCapture.FLASH_MODE_OFF
            }
            val ret = JSObject()
            ret.put("success", true)
            ret.put("flashMode", flashMode)
            call.resolve(ret)
        } ?: run {
            call.reject("Camera not initialized")
        }
    }

    @PluginMethod
    fun setTorchEnabled(call: PluginCall) {
        val enabled = call.getBoolean("enabled", false) ?: false
        camera?.let {
            if (it.cameraInfo.hasFlashUnit()) {
                it.cameraControl.enableTorch(enabled)
                val ret = JSObject()
                ret.put("success", true)
                ret.put("torchEnabled", enabled)
                call.resolve(ret)
            } else {
                call.reject("Device does not have flash unit")
            }
        } ?: run {
            call.reject("Camera not initialized")
        }
    }

    @PluginMethod
    fun setZoomRatio(call: PluginCall) {
        val ratio = call.getFloat("ratio")?.toFloat() ?: 1.0f
        camera?.let {
            val zoomState = it.cameraInfo.zoomState.value
            val minRatio = zoomState?.minZoomRatio ?: 1.0f
            val maxRatio = zoomState?.maxZoomRatio ?: 1.0f
            val clampedRatio = ratio.coerceIn(minRatio, maxRatio)
            it.cameraControl.setZoomRatio(clampedRatio)
            val ret = JSObject()
            ret.put("success", true)
            ret.put("zoomRatio", clampedRatio)
            ret.put("minZoomRatio", minRatio)
            ret.put("maxZoomRatio", maxRatio)
            call.resolve(ret)
        } ?: run {
            call.reject("Camera not initialized")
        }
    }

    @PluginMethod
    fun getCameraInfo(call: PluginCall) {
        camera?.let {
            val zoomState = it.cameraInfo.zoomState.value
            val ret = JSObject()
            ret.put("hasFlashUnit", it.cameraInfo.hasFlashUnit())
            ret.put("minZoomRatio", zoomState?.minZoomRatio ?: 1.0f)
            ret.put("maxZoomRatio", zoomState?.maxZoomRatio ?: 1.0f)
            ret.put("currentZoomRatio", zoomState?.zoomRatio ?: 1.0f)
            call.resolve(ret)
        } ?: run {
            call.reject("Camera not initialized")
        }
    }

    @PluginMethod
    fun startInclinometer(call: PluginCall) {
        if (inclinometerRunning) {
            call.resolve(JSObject().apply { put("started", true) })
            return
        }
        val sm = sensorManager ?: run {
            call.reject("SensorManager not available")
            return
        }
        sensorListener = object : SensorEventListener {
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
            override fun onSensorChanged(event: SensorEvent) {
                when (event.sensor.type) {
                    Sensor.TYPE_ACCELEROMETER -> {
                        accelVals = lowPass(event.values.clone(), accelVals)
                    }
                    Sensor.TYPE_MAGNETIC_FIELD -> {
                        magnetVals = lowPass(event.values.clone(), magnetVals)
                    }
                }
                val a = accelVals
                val m = magnetVals
                if (a != null && m != null) {
                    val R = FloatArray(9)
                    val I = FloatArray(9)
                    if (SensorManager.getRotationMatrix(R, I, a, m)) {
                        val orientation = FloatArray(3)
                        SensorManager.getOrientation(R, orientation)
                        // orientation[]: azimuth(yaw), pitch, roll (radians)
                        val pitchDeg = Math.toDegrees(orientation[1].toDouble())
                        val rollDeg = Math.toDegrees(orientation[2].toDouble())
                        val unstable = (abs(pitchDeg) > STABILITY_DEGREE_THRESHOLD || abs(rollDeg) > STABILITY_DEGREE_THRESHOLD)
                        notifyListeners("inclinometer", JSObject().apply {
                            put("pitchDeg", pitchDeg)
                            put("rollDeg", rollDeg)
                            put("stable", !unstable)
                        })
                    }
                }
            }
        }
        sm.registerListener(sensorListener, accel, SensorManager.SENSOR_DELAY_UI)
        sm.registerListener(sensorListener, magnet, SensorManager.SENSOR_DELAY_UI)
        inclinometerRunning = true
        call.resolve(JSObject().apply { put("started", true) })
    }

    @PluginMethod
    fun stopInclinometer(call: PluginCall) {
        if (!inclinometerRunning) {
            call.resolve(JSObject().apply { put("stopped", true) })
            return
        }
        sensorManager?.unregisterListener(sensorListener)
        sensorListener = null
        inclinometerRunning = false
        call.resolve(JSObject().apply { put("stopped", true) })
    }

    private fun lowPass(input: FloatArray, output: FloatArray?): FloatArray {
        if (output == null) return input
        for (i in input.indices) {
            output[i] = output[i] + ALPHA * (input[i] - output[i])
        }
        return output
    }

    @PluginMethod
    fun stopCamera(call: PluginCall) {
        try {
            cameraProvider?.unbindAll()
            camera = null
            imageCapture = null
            // Remove preview view from container to reveal web UI fully if needed
            previewView?.let { pv ->
                (pv.parent as? ViewGroup)?.removeView(pv)
            }
            previewView = null
            previewContainer?.let { pc ->
                (pc.parent as? ViewGroup)?.removeView(pc)
            }
            previewContainer = null
            val ret = JSObject()
            ret.put("success", true)
            ret.put("message", "Camera stopped")
            call.resolve(ret)
            notifyListeners("cameraReady", JSObject().apply { put("ready", false) })
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping camera", e)
            call.reject("Error stopping camera: ${e.message}", e)
        }
    }

    @PluginMethod
    fun openGallery(call: PluginCall) {
        try {
            val intent = Intent(Intent.ACTION_PICK).apply {
                type = "image/*"
            }
            startActivityForResult(call, intent, "galleryResult")
        } catch (e: Exception) {
            Log.e(TAG, "Error opening gallery", e)
            call.reject("Error opening gallery: ${e.message}", e)
        }
    }

    @PluginMethod
    fun launchNewAnalysis(call: PluginCall) {
        try {
            val state = getPermissionState("camera")
            if (state != PermissionState.GRANTED) {
                requestPermissionForAlias("camera", call, "launchNewAnalysisAfterPermission")
                return
            }
            val intent = Intent(activity, NewAnalysisActivity::class.java)
            startActivityForResult(call, intent, "newAnalysisResult")
        } catch (e: Exception) {
            call.reject("Failed to launch new analysis: ${e.message}", e)
        }
    }

    @PermissionCallback
    private fun launchNewAnalysisAfterPermission(call: PluginCall) {
        val state = getPermissionState("camera")
        if (state != PermissionState.GRANTED) {
            val ret = JSObject()
            ret.put("success", false)
            ret.put("message", "Camera permission denied")
            call.resolve(ret)
            return
        }
        launchNewAnalysis(call)
    }

    @ActivityCallback
    private fun galleryResult(call: PluginCall, result: ActivityResult) {
        try {
            if (result.resultCode != android.app.Activity.RESULT_OK) {
                call.resolve(JSObject().apply {
                    put("success", false)
                    put("message", "Canceled")
                })
                notifyListeners("galleryCanceled", JSObject())
                return
            }

            val uri: Uri? = result.data?.data
            if (uri == null) {
                call.resolve(JSObject().apply {
                    put("success", false)
                    put("message", "No image selected")
                })
                return
            }

            call.resolve(JSObject().apply {
                put("success", true)
                put("uri", uri.toString())
            })
            notifyListeners("galleryPicked", JSObject().apply { put("uri", uri.toString()) })
        } catch (e: Exception) {
            Log.e(TAG, "Gallery result error", e)
            call.reject("Gallery result error: ${e.message}", e)
        }
    }

    @ActivityCallback
    private fun newAnalysisResult(call: PluginCall, result: ActivityResult) {
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val uri = result.data?.getStringExtra("capturedUri") ?: ""
            call.resolve(JSObject().apply {
                put("success", true)
                put("uri", uri)
            })
        } else {
            call.resolve(JSObject().apply {
                put("success", false)
                put("message", "Canceled")
            })
        }
    }

    private fun checkCameraPermission(): Boolean {
        return hasPermission(Manifest.permission.CAMERA)
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        cameraExecutor.shutdown()
        cameraProvider?.unbindAll()
        previewView = null
        previewContainer = null
        if (inclinometerRunning) {
            sensorManager?.unregisterListener(sensorListener)
            sensorListener = null
            inclinometerRunning = false
        }
    }
}

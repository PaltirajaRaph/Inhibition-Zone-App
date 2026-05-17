package com.biotechnology.app

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Environment
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.sqrt

class NewAnalysisActivity : AppCompatActivity() {
    private var imageCapture: ImageCapture? = null
    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var previewView: PreviewView
    private lateinit var capturedImageView: ImageView

    private lateinit var backButton: ImageButton
    private lateinit var galleryButton: ImageButton
    private lateinit var captureButton: ImageButton
    private lateinit var confirmLayout: LinearLayout
    private var lastCapturedUri: String? = null

    private var sensorManager: SensorManager? = null
    private var accel: Sensor? = null
    private var magnet: Sensor? = null
    private var sensorListener: SensorEventListener? = null
    private var accelVals: FloatArray? = null
    private var magnetVals: FloatArray? = null
    private lateinit var tiltContainer: LinearLayout
    private lateinit var tiltStatusText: TextView
    private lateinit var tiltAngleText: TextView
    private lateinit var guideContainer: FrameLayout
    private lateinit var guideCircleView: View
    private var lastTiltUiUpdateAt = 0L
    private var isTiltOk = false
    private var guideSizePercent = 82
    private val galleryRequestCode = 1201

    companion object {
        private const val FILENAME_FORMAT = "yyyy-MM-dd-HH-mm-ss-SSS"
		private const val STABILITY_DEGREE_THRESHOLD = 15.0 // degrees
		private const val ALPHA = 0.2f
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        cameraExecutor = Executors.newSingleThreadExecutor()

		sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
		accel = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
		magnet = sensorManager?.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)

        // Unified sizing so camera/confirm/cancel icons look consistent and buttons are easier to tap
        // NOTE: Use FIT_CENTER (not CENTER_INSIDE) so vector icons scale up visually.
        val iconButtonSize = dp(84)
        val iconPadding = dp(14)

        // Root container
        val root = FrameLayout(this)
        root.setBackgroundColor(Color.BLACK)
        setContentView(root)

        // PreviewView
        previewView = PreviewView(this).apply {
            implementationMode = PreviewView.ImplementationMode.PERFORMANCE
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
        root.addView(previewView, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))

        // Tilt indicator (top-center)
        tiltContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(16), dp(12), dp(16), dp(12))
            setBackgroundColor(Color.parseColor("#99000000"))
        }

        tiltStatusText = TextView(this).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            text = "TILT"
            gravity = Gravity.CENTER
        }
        tiltAngleText = TextView(this).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            text = "Angle: —"
            gravity = Gravity.CENTER
        }

        tiltContainer.addView(tiltStatusText)
        val angleLp = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        )
        angleLp.topMargin = dp(2)
        tiltContainer.addView(tiltAngleText, angleLp)

        val tiltParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        )
        tiltParams.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
        tiltParams.topMargin = dp(16) + getStatusBarHeight()
        root.addView(tiltContainer, tiltParams)

        // Petri dish guide overlay (center)
        guideContainer = FrameLayout(this).apply {
            isClickable = false
            isFocusable = false
            setBackgroundColor(Color.TRANSPARENT)
        }
        guideCircleView = object : View(this) {
            private val paint = android.graphics.Paint().apply {
                style = android.graphics.Paint.Style.STROKE
                color = Color.WHITE
                strokeWidth = dp(3).toFloat()
                isAntiAlias = true
                alpha = 220
            }

            override fun onDraw(canvas: android.graphics.Canvas) {
                super.onDraw(canvas)
                val w = width.toFloat()
                val h = height.toFloat()
                val cx = w / 2f
                val cy = h / 2f
                val radius = (Math.min(w, h) - paint.strokeWidth) / 2f
                canvas.drawCircle(cx, cy, radius, paint)
            }
        }
        guideContainer.addView(guideCircleView)
        root.addView(guideContainer, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))
        // Set a fixed guide size (user aligns petri dish to this circle)
        val guideWidth = (resources.displayMetrics.widthPixels * guideSizePercent / 100f).toInt()
        val circleParams = FrameLayout.LayoutParams(guideWidth, guideWidth).apply { gravity = Gravity.CENTER }
        guideCircleView.layoutParams = circleParams

        // Instruction text below circle
        val instructionText = TextView(this).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            text = "Adjust the shape of petri dish with the circle"
            gravity = Gravity.CENTER
            setPadding(dp(16), dp(8), dp(16), dp(8))
        }
        val instructionParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        instructionParams.gravity = Gravity.CENTER_HORIZONTAL or Gravity.BOTTOM
        instructionParams.bottomMargin = dp(140)
        root.addView(instructionText, instructionParams)

        // Captured image overlay (hidden initially)
        capturedImageView = ImageView(this).apply {
            visibility = View.GONE
            // Show full image without cropping. Keep aspect ratio and center inside view.
            scaleType = ImageView.ScaleType.FIT_CENTER
            adjustViewBounds = true
            setBackgroundColor(Color.BLACK)
        }
        root.addView(capturedImageView, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))

        // Back button (top-left)
        backButton = ImageButton(this).apply {
            setImageResource(R.drawable.ic_back)
            background = null
            setColorFilter(Color.WHITE)
            setPadding(iconPadding, iconPadding, iconPadding, iconPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Kembali"
            setOnClickListener { finish() }
        }
        val backParams = FrameLayout.LayoutParams(
            iconButtonSize,
            iconButtonSize
        )
        backParams.gravity = Gravity.START or Gravity.TOP
        backParams.leftMargin = dp(16)
        backParams.topMargin = dp(16) + getStatusBarHeight()
        root.addView(backButton, backParams)

        // Gallery button (top-right)
        galleryButton = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_gallery)
            background = null
            setColorFilter(Color.WHITE)
            setPadding(iconPadding, iconPadding, iconPadding, iconPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Galeri"
            setOnClickListener { openGallery() }
        }
        val galleryParams = FrameLayout.LayoutParams(
            iconButtonSize,
            iconButtonSize
        )
        galleryParams.gravity = Gravity.END or Gravity.TOP
        galleryParams.rightMargin = dp(16)
        galleryParams.topMargin = dp(16) + getStatusBarHeight()
        root.addView(galleryButton, galleryParams)


        // Capture button (bottom center)
        captureButton = ImageButton(this).apply {
            setImageResource(R.drawable.ic_camera)
            background = null
            setColorFilter(Color.WHITE)
            setPadding(iconPadding, iconPadding, iconPadding, iconPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Ambil Gambar"
        }
        val capParams = FrameLayout.LayoutParams(
            iconButtonSize,
            iconButtonSize
        )
        capParams.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
        capParams.bottomMargin = dp(24)
        root.addView(captureButton, capParams)

        // Default: disable capture until tilt is OK
        setCaptureEnabled(false)

        // Confirm overlay (hidden initially)
        confirmLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#80000000"))
            visibility = View.GONE
			layoutDirection = View.LAYOUT_DIRECTION_LTR
        }
        val checkButton = ImageButton(this).apply {
            setImageResource(R.drawable.ic_check)
            background = null
            setColorFilter(Color.WHITE)
            setPadding(iconPadding, iconPadding, iconPadding, iconPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Konfirmasi"
        }
        val cancelButton = ImageButton(this).apply {
            setImageResource(R.drawable.ic_close)
            background = null
            setColorFilter(Color.WHITE)
            setPadding(iconPadding, iconPadding, iconPadding, iconPadding)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Ulangi"
        }
        val confirmParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(112)
        )
        confirmParams.gravity = Gravity.BOTTOM
        root.addView(confirmLayout, confirmParams)

        val buttonSize = iconButtonSize
        val buttonMargin = dp(18)
        val checkLp = LinearLayout.LayoutParams(buttonSize, buttonSize).apply {
            leftMargin = buttonMargin
            rightMargin = buttonMargin
        }
        val cancelLp = LinearLayout.LayoutParams(buttonSize, buttonSize).apply {
            leftMargin = buttonMargin
            rightMargin = buttonMargin
        }

        confirmLayout.addView(checkButton, checkLp)
        confirmLayout.addView(cancelButton, cancelLp)

        // Camera setup
        startCamera()

        captureButton.setOnClickListener {
            if (!isTiltOk) {
                Toast.makeText(this, "Angle not OK (max. 15°)", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            takePicture { savedUri ->
                lastCapturedUri = savedUri

                if (!savedUri.isNullOrEmpty()) {
                    try {
                        capturedImageView.setImageURI(Uri.parse(savedUri))
                    } catch (_: Exception) {
                    }
                } else {
                    capturedImageView.setImageDrawable(null)
                }

                capturedImageView.visibility = View.VISIBLE
                confirmLayout.visibility = View.VISIBLE
                captureButton.visibility = View.GONE
                guideContainer.visibility = View.GONE
                galleryButton.visibility = View.GONE

                checkButton.setOnClickListener {
                    val data = Intent().apply {
                        putExtra("capturedUri", lastCapturedUri ?: "")
                    }
                    setResult(RESULT_OK, data)
                    finish()
                }

                cancelButton.setOnClickListener {
                    confirmLayout.visibility = View.GONE
                    capturedImageView.visibility = View.GONE
                    capturedImageView.setImageDrawable(null)
                    lastCapturedUri = null
                    captureButton.visibility = View.VISIBLE
                    guideContainer.visibility = View.VISIBLE
                    galleryButton.visibility = View.VISIBLE
                    setCaptureEnabled(isTiltOk)
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        startTiltListener()
    }

    override fun onPause() {
        stopTiltListener()
        super.onPause()
    }

    private fun startTiltListener() {
        val sm = sensorManager ?: return
        if (sensorListener != null) return
        val a = accel
        val m = magnet
        if (a == null || m == null) return

        sensorListener = object : SensorEventListener {
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
            override fun onSensorChanged(event: SensorEvent) {
                val now = System.currentTimeMillis()
                if (now - lastTiltUiUpdateAt < 80) {
                    return
                }
                when (event.sensor.type) {
                    Sensor.TYPE_ACCELEROMETER -> accelVals = lowPass(event.values.clone(), accelVals)
                    Sensor.TYPE_MAGNETIC_FIELD -> magnetVals = lowPass(event.values.clone(), magnetVals)
                }
                val accelNow = accelVals
                val magnetNow = magnetVals
                if (accelNow != null && magnetNow != null) {
                    val rotationMatrix = FloatArray(9)
                    val inclinationMatrix = FloatArray(9)
                    if (SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, accelNow, magnetNow)) {
                        val orientation = FloatArray(3)
                        SensorManager.getOrientation(rotationMatrix, orientation)
                        val pitchDeg = Math.toDegrees(orientation[1].toDouble())
                        val rollDeg = Math.toDegrees(orientation[2].toDouble())
                        val angle = sqrt(pitchDeg * pitchDeg + rollDeg * rollDeg)
						val stable = (angle <= STABILITY_DEGREE_THRESHOLD)
                        lastTiltUiUpdateAt = now
                        val statusText = if (stable) "OK" else "TILT"
                        val bg = if (stable) "#8A166534" else "#8A7A1C1C"
                        tiltContainer.setBackgroundColor(Color.parseColor(bg))
                        tiltStatusText.text = statusText
                        tiltAngleText.text = "Angle: ${String.format(Locale.US, "%.1f", angle)}°"

                        setCaptureEnabled(stable)
                    }
                }
            }
        }
        sm.registerListener(sensorListener, a, SensorManager.SENSOR_DELAY_UI)
        sm.registerListener(sensorListener, m, SensorManager.SENSOR_DELAY_UI)
    }

    private fun stopTiltListener() {
        val sm = sensorManager ?: return
        sensorListener?.let { sm.unregisterListener(it) }
        sensorListener = null
    }

    private fun lowPass(input: FloatArray, output: FloatArray?): FloatArray {
        if (output == null) return input
        for (i in input.indices) {
            output[i] = output[i] + ALPHA * (input[i] - output[i])
        }
        return output
    }

    private fun setCaptureEnabled(enabled: Boolean) {
        isTiltOk = enabled
        // If user is on captured preview, capture button is hidden anyway.
        captureButton.isEnabled = enabled
        captureButton.alpha = if (enabled) 1.0f else 0.35f
    }

    private fun openGallery() {
        val intent = Intent(Intent.ACTION_PICK).apply {
            type = "image/*"
        }
        startActivityForResult(intent, galleryRequestCode)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != galleryRequestCode || resultCode != RESULT_OK) return

        val selectedUri = data?.data ?: return
        lastCapturedUri = selectedUri.toString()
        capturedImageView.setImageURI(selectedUri)
        capturedImageView.visibility = View.VISIBLE
        confirmLayout.visibility = View.VISIBLE
        captureButton.visibility = View.GONE
        guideContainer.visibility = View.GONE
        galleryButton.visibility = View.GONE

        // Reuse the same confirm / cancel behavior as camera capture
        val checkButton = confirmLayout.getChildAt(0) as ImageButton
        val cancelButton = confirmLayout.getChildAt(1) as ImageButton
        checkButton.setOnClickListener {
            val result = Intent().apply {
                putExtra("capturedUri", lastCapturedUri ?: "")
            }
            setResult(RESULT_OK, result)
            finish()
        }
        cancelButton.setOnClickListener {
            confirmLayout.visibility = View.GONE
            capturedImageView.visibility = View.GONE
            capturedImageView.setImageDrawable(null)
            lastCapturedUri = null
                    captureButton.visibility = View.VISIBLE
                    guideContainer.visibility = View.VISIBLE
                    galleryButton.visibility = View.VISIBLE
            setCaptureEnabled(isTiltOk)
        }
    }

    private fun startCamera() {
        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            cameraProvider = providerFuture.get()
            val preview = Preview.Builder().build()
            preview.setSurfaceProvider(previewView.surfaceProvider)

            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .setTargetRotation(previewView.display?.rotation ?: android.view.Surface.ROTATION_0)
                .build()

            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            cameraProvider?.unbindAll()
            camera = cameraProvider?.bindToLifecycle(this, selector, preview, imageCapture)

            // Inclinometer overlay removed per UI request
        }, ContextCompat.getMainExecutor(this))
    }

    private fun takePicture(onSaved: (String?) -> Unit) {
        val ic = imageCapture ?: return
        val name = SimpleDateFormat(FILENAME_FORMAT, Locale.US).format(System.currentTimeMillis())

        // Prefer app-scoped external files directory to ensure we always have a resolvable URI
        val picturesDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        val bioLabDir = java.io.File(picturesDir, "BioLab").apply { if (!exists()) mkdirs() }
        val photoFile = java.io.File(bioLabDir, "BioLab_${name}.jpg")

        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        ic.takePicture(outputOptions, cameraExecutor, object : ImageCapture.OnImageSavedCallback {
            override fun onError(exception: ImageCaptureException) {
                runOnUiThread {
                    Toast.makeText(this@NewAnalysisActivity, "Gagal mengambil gambar: ${exception.message}", Toast.LENGTH_SHORT).show()
                }
            }
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                // Always return the concrete saved file so the WebView can reopen it reliably.
                val uri = Uri.fromFile(photoFile)
                runOnUiThread { onSaved(uri.toString()) }
            }
        })
    }

    private fun getStatusBarHeight(): Int {
        val resourceId = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (resourceId > 0) resources.getDimensionPixelSize(resourceId) else 0
    }

    private fun dp(v: Int): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics
    ).toInt()

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        cameraProvider?.unbindAll()
    }
}

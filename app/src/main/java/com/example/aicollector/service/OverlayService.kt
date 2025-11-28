package com.example.aicollector.service

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import com.example.aicollector.R
import com.example.aicollector.domain.usecase.SubmitCollectionUseCase
import com.example.aicollector.util.NetworkResult
import com.example.aicollector.util.SecureLogger
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class OverlayService : Service() {
    
    @Inject
    lateinit var submitCollectionUseCase: SubmitCollectionUseCase
    
    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var isTextSelectionMode = false
    
    override fun onCreate() {
        super.onCreate()
        SecureLogger.d("OverlayService", "Overlay service created")
        showFloatingButton()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        SecureLogger.d("OverlayService", "Overlay service destroyed")
        removeFloatingButton()
        serviceScope.cancel()
    }
    
    private fun showFloatingButton() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        // Create floating button view
        floatingView = LayoutInflater.from(this).inflate(
            android.R.layout.simple_list_item_1, // Temporary layout
            null
        )
        
        // For production, create a custom layout:
        // floatingView = LayoutInflater.from(this).inflate(R.layout.floating_button, null)
        
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 100
        }
        
        // Add touch listener for dragging
        floatingView?.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            
            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = layoutParams.x
                        initialY = layoutParams.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        layoutParams.x = initialX + (event.rawX - initialTouchX).toInt()
                        layoutParams.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(floatingView, layoutParams)
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        val deltaX = event.rawX - initialTouchX
                        val deltaY = event.rawY - initialTouchY
                        
                        // If it's a click (not a drag)
                        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                            onFloatingButtonClick()
                        }
                        return true
                    }
                }
                return false
            }
        })
        
        try {
            windowManager?.addView(floatingView, layoutParams)
            SecureLogger.d("OverlayService", "Floating button added")
        } catch (e: Exception) {
            SecureLogger.e("OverlayService", "Failed to add floating button: ${e.message}", e)
        }
    }
    
    private fun removeFloatingButton() {
        floatingView?.let {
            windowManager?.removeView(it)
            floatingView = null
        }
    }
    
    private fun onFloatingButtonClick() {
        SecureLogger.d("OverlayService", "Floating button clicked")
        
        if (!isTextSelectionMode) {
            activateTextSelectionMode()
        } else {
            deactivateTextSelectionMode()
        }
    }
    
    private fun activateTextSelectionMode() {
        isTextSelectionMode = true
        SecureLogger.d("OverlayService", "Text selection mode activated")
        
        // TODO: Integrate with Accessibility Service to capture selected text
        // For now, simulate text capture
        captureSelectedText("示例文本内容")
    }
    
    private fun deactivateTextSelectionMode() {
        isTextSelectionMode = false
        SecureLogger.d("OverlayService", "Text selection mode deactivated")
    }
    
    private fun captureSelectedText(text: String) {
        if (text.isBlank()) {
            SecureLogger.w("OverlayService", "Captured text is empty")
            return
        }
        
        serviceScope.launch {
            when (val result = submitCollectionUseCase(text)) {
                is NetworkResult.Success -> {
                    SecureLogger.d("OverlayService", "Text collected successfully")
                    // TODO: Show success toast or notification
                }
                is NetworkResult.Error -> {
                    SecureLogger.e("OverlayService", "Failed to collect text: ${result.message}")
                    // TODO: Show error toast
                }
                else -> {}
            }
        }
        
        deactivateTextSelectionMode()
    }
}

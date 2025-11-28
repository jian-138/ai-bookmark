package com.example.aicollector.service

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.example.aicollector.util.SecureLogger

class TextCaptureAccessibilityService : AccessibilityService() {
    
    private var selectedText: String? = null
    
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED -> {
                handleTextSelection(event)
            }
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                handleViewFocused(event)
            }
        }
    }
    
    override fun onInterrupt() {
        SecureLogger.d("AccessibilityService", "Service interrupted")
    }
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        SecureLogger.d("AccessibilityService", "Service connected")
    }
    
    private fun handleTextSelection(event: AccessibilityEvent) {
        val source = event.source ?: return
        
        try {
            val selectedText = extractSelectedText(source)
            if (!selectedText.isNullOrBlank()) {
                this.selectedText = selectedText
                SecureLogger.d("AccessibilityService", "Text selected: ${selectedText.take(50)}...")
                
                // Broadcast selected text to OverlayService
                broadcastSelectedText(selectedText)
            }
        } catch (e: Exception) {
            SecureLogger.e("AccessibilityService", "Error extracting text: ${e.message}", e)
        } finally {
            @Suppress("DEPRECATION")
            source.recycle()
        }
    }
    
    private fun handleViewFocused(event: AccessibilityEvent) {
        val source = event.source ?: return
        
        try {
            val text = extractText(source)
            if (!text.isNullOrBlank()) {
                SecureLogger.d("AccessibilityService", "View focused with text: ${text.take(50)}...")
            }
        } catch (e: Exception) {
            SecureLogger.e("AccessibilityService", "Error handling focus: ${e.message}", e)
        } finally {
            @Suppress("DEPRECATION")
            source.recycle()
        }
    }
    
    private fun extractSelectedText(node: AccessibilityNodeInfo): String? {
        // Try to get selected text
        val text = node.text?.toString() ?: return null
        
        val selectionStart = node.textSelectionStart
        val selectionEnd = node.textSelectionEnd
        
        return if (selectionStart >= 0 && selectionEnd > selectionStart && selectionEnd <= text.length) {
            text.substring(selectionStart, selectionEnd)
        } else {
            null
        }
    }
    
    private fun extractText(node: AccessibilityNodeInfo): String? {
        return node.text?.toString()
    }
    
    private fun broadcastSelectedText(text: String) {
        // TODO: Implement broadcast to OverlayService or use a shared repository
        // For now, just log
        SecureLogger.d("AccessibilityService", "Broadcasting selected text")
    }
    
    fun getSelectedText(): String? {
        return selectedText
    }
    
    fun clearSelectedText() {
        selectedText = null
    }
}

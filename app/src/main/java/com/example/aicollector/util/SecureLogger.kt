package com.example.aicollector.util

import android.util.Log

object SecureLogger {
    private const val TAG = "AICollector"
    
    // Patterns to detect sensitive information
    private val sensitivePatterns = listOf(
        Regex("Bearer\\s+[A-Za-z0-9\\-._~+/]+=*", RegexOption.IGNORE_CASE),
        Regex("password[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
        Regex("token[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
        Regex("api[_-]?key[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
        Regex("secret[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE)
    )
    
    private fun sanitize(message: String): String {
        var sanitized = message
        sensitivePatterns.forEach { pattern ->
            sanitized = pattern.replace(sanitized, "[REDACTED]")
        }
        return sanitized
    }
    
    fun d(tag: String = TAG, message: String) {
        Log.d(tag, sanitize(message))
    }
    
    fun i(tag: String = TAG, message: String) {
        Log.i(tag, sanitize(message))
    }
    
    fun w(tag: String = TAG, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.w(tag, sanitize(message), throwable)
        } else {
            Log.w(tag, sanitize(message))
        }
    }
    
    fun e(tag: String = TAG, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.e(tag, sanitize(message), throwable)
        } else {
            Log.e(tag, sanitize(message))
        }
    }
    
    fun v(tag: String = TAG, message: String) {
        Log.v(tag, sanitize(message))
    }
}

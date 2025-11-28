package com.example.aicollector.util

import com.example.aicollector.BuildConfig

/**
 * Configuration object for development mode features.
 * Only available in debug builds.
 */
object DevModeConfig {
    const val TEST_USERNAME = "test"
    const val TEST_PASSWORD = "test123"
    const val TEST_USER_ID = "dev-user-001"
    const val MOCK_TOKEN_PREFIX = "mock_token_"
    
    /**
     * Returns true if development mode is enabled (debug builds only)
     */
    val isEnabled: Boolean
        get() = BuildConfig.DEV_MODE_ENABLED
    
    /**
     * Checks if the provided credentials match the test account
     */
    fun isTestCredentials(username: String, password: String): Boolean {
        return username == TEST_USERNAME && password == TEST_PASSWORD
    }
    
    /**
     * Generates a mock authentication token for development mode
     */
    fun generateMockToken(): String {
        return "$MOCK_TOKEN_PREFIX${System.currentTimeMillis()}"
    }
}

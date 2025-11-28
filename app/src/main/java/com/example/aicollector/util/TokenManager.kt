package com.example.aicollector.util

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    fun saveToken(token: String) {
        sharedPreferences.edit().putString(KEY_TOKEN, token).apply()
    }
    
    fun getToken(): String? {
        return sharedPreferences.getString(KEY_TOKEN, null)
    }
    
    fun saveUserId(userId: String) {
        sharedPreferences.edit().putString(KEY_USER_ID, userId).apply()
    }
    
    fun getUserId(): String? {
        return sharedPreferences.getString(KEY_USER_ID, null)
    }
    
    fun saveTokenExpiry(expiresIn: Long) {
        val expiryTime = System.currentTimeMillis() + (expiresIn * 1000)
        sharedPreferences.edit().putLong(KEY_TOKEN_EXPIRY, expiryTime).apply()
    }
    
    fun isTokenExpired(): Boolean {
        val expiryTime = sharedPreferences.getLong(KEY_TOKEN_EXPIRY, 0)
        return System.currentTimeMillis() >= expiryTime
    }
    
    fun clearToken() {
        sharedPreferences.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_TOKEN_EXPIRY)
            .apply()
    }
    
    fun isAuthenticated(): Boolean {
        return getToken() != null && !isTokenExpired()
    }
    
    companion object {
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_TOKEN_EXPIRY = "token_expiry"
    }
}

package com.example.aicollector.data.remote

import com.example.aicollector.util.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip auth for login endpoint
        if (originalRequest.url.encodedPath.contains("/auth/login")) {
            return chain.proceed(originalRequest)
        }
        
        // Add auth token to request
        val token = tokenManager.getToken()
        val newRequest = if (token != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(newRequest)
    }
}

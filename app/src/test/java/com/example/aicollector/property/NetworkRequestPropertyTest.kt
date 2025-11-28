package com.example.aicollector.property

import com.example.aicollector.data.remote.AuthInterceptor
import com.example.aicollector.util.TokenManager
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.string.shouldStartWith
import io.kotest.property.Arb
import io.kotest.property.arbitrary.string
import io.kotest.property.checkAll
import io.mockk.every
import io.mockk.mockk
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okhttp3.Protocol
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody

/**
 * Feature: ai-collector-frontend, Property 6: Network request completeness
 * Validates: Requirements 3.1, 3.5
 * 
 * Property: For any confirmed text collection, the system should send a POST request
 * to the backend API that includes the text content and authentication token in the header
 */
class NetworkRequestPropertyTest : StringSpec({
    
    "All non-login requests should include authentication token in header" {
        checkAll(100, Arb.string(20..100)) { token ->
            val tokenManager = mockk<TokenManager>()
            every { tokenManager.getToken() } returns token
            
            val authInterceptor = AuthInterceptor(tokenManager)
            
            val request = Request.Builder()
                .url("https://api.example.com/api/collect")
                .build()
            
            val chain = mockk<Interceptor.Chain>()
            every { chain.request() } returns request
            every { chain.proceed(any()) } answers {
                val modifiedRequest = firstArg<Request>()
                
                // Verify token is added to header
                val authHeader = modifiedRequest.header("Authorization")
                authHeader shouldNotBe null
                authHeader shouldStartWith "Bearer "
                authHeader shouldBe "Bearer $token"
                
                // Return mock response
                Response.Builder()
                    .request(modifiedRequest)
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("OK")
                    .body("{}".toResponseBody("application/json".toMediaType()))
                    .build()
            }
            
            authInterceptor.intercept(chain)
        }
    }
    
    "Login requests should not include authentication token" {
        val tokenManager = mockk<TokenManager>()
        every { tokenManager.getToken() } returns "some-token"
        
        val authInterceptor = AuthInterceptor(tokenManager)
        
        val request = Request.Builder()
            .url("https://api.example.com/api/auth/login")
            .build()
        
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            val modifiedRequest = firstArg<Request>()
            
            // Verify no auth header is added for login
            val authHeader = modifiedRequest.header("Authorization")
            authHeader shouldBe null
            
            Response.Builder()
                .request(modifiedRequest)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }
        
        authInterceptor.intercept(chain)
    }
    
    "Requests without token should proceed without auth header" {
        val tokenManager = mockk<TokenManager>()
        every { tokenManager.getToken() } returns null
        
        val authInterceptor = AuthInterceptor(tokenManager)
        
        val request = Request.Builder()
            .url("https://api.example.com/api/collect")
            .build()
        
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            val modifiedRequest = firstArg<Request>()
            
            // Verify no auth header when token is null
            val authHeader = modifiedRequest.header("Authorization")
            authHeader shouldBe null
            
            Response.Builder()
                .request(modifiedRequest)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }
        
        authInterceptor.intercept(chain)
    }
})

package com.example.aicollector.data.repository

import com.example.aicollector.data.local.dao.CollectionDao
import com.example.aicollector.data.model.LoginRequest
import com.example.aicollector.data.model.LoginResponse
import com.example.aicollector.data.remote.ApiService
import com.example.aicollector.domain.repository.AuthRepository
import com.example.aicollector.util.DevModeConfig
import com.example.aicollector.util.NetworkHelper
import com.example.aicollector.util.NetworkResult
import com.example.aicollector.util.TokenManager
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager,
    private val collectionDao: CollectionDao
) : AuthRepository {
    
    override suspend fun login(username: String, password: String): NetworkResult<LoginResponse> {
        // Check for dev mode test credentials
        if (DevModeConfig.isEnabled && DevModeConfig.isTestCredentials(username, password)) {
            return handleDevModeLogin()
        }
        
        // Normal authentication flow
        val request = LoginRequest(username, password)
        val result = NetworkHelper.safeApiCall { apiService.login(request) }
        
        if (result is NetworkResult.Success) {
            val response = result.data
            tokenManager.saveToken(response.token)
            tokenManager.saveUserId(response.userId)
            tokenManager.saveTokenExpiry(response.expiresIn)
        }
        
        return result
    }
    
    private suspend fun handleDevModeLogin(): NetworkResult<LoginResponse> {
        val mockToken = DevModeConfig.generateMockToken()
        val mockResponse = LoginResponse(
            token = mockToken,
            userId = DevModeConfig.TEST_USER_ID,
            expiresIn = 86400000L // 24 hours in milliseconds
        )
        
        tokenManager.saveToken(mockResponse.token)
        tokenManager.saveUserId(mockResponse.userId)
        tokenManager.saveTokenExpiry(mockResponse.expiresIn)
        
        return NetworkResult.Success(mockResponse)
    }
    
    override suspend fun logout() {
        val userId = tokenManager.getUserId()
        tokenManager.clearToken()
        
        // Clear local cache
        userId?.let {
            collectionDao.deleteAllCollections(it)
        }
    }
    
    override fun isAuthenticated(): Boolean {
        return tokenManager.isAuthenticated()
    }
    
    override fun getUserId(): String? {
        return tokenManager.getUserId()
    }
}

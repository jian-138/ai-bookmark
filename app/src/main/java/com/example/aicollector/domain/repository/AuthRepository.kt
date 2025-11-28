package com.example.aicollector.domain.repository

import com.example.aicollector.data.model.LoginResponse
import com.example.aicollector.util.NetworkResult

interface AuthRepository {
    suspend fun login(username: String, password: String): NetworkResult<LoginResponse>
    suspend fun logout()
    fun isAuthenticated(): Boolean
    fun getUserId(): String?
}

package com.example.aicollector.domain.usecase

import com.example.aicollector.domain.repository.AuthRepository
import com.example.aicollector.util.NetworkResult
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(username: String, password: String): NetworkResult<Unit> {
        // Validate inputs
        if (username.isBlank()) {
            return NetworkResult.Error("Username cannot be empty")
        }
        if (password.isBlank()) {
            return NetworkResult.Error("Password cannot be empty")
        }
        
        return when (val result = authRepository.login(username, password)) {
            is NetworkResult.Success -> NetworkResult.Success(Unit)
            is NetworkResult.Error -> result
            is NetworkResult.Loading -> NetworkResult.Loading
        }
    }
}

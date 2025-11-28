package com.example.aicollector.util

import retrofit2.Response
import java.io.IOException

object NetworkHelper {
    
    suspend fun <T> safeApiCall(apiCall: suspend () -> Response<T>): NetworkResult<T> {
        return try {
            val response = apiCall()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    NetworkResult.Success(body)
                } else {
                    NetworkResult.Error("Empty response body", response.code())
                }
            } else {
                NetworkResult.Error(
                    message = response.message() ?: "Unknown error",
                    code = response.code()
                )
            }
        } catch (e: IOException) {
            NetworkResult.Error("Network error: ${e.message}")
        } catch (e: Exception) {
            NetworkResult.Error("Unexpected error: ${e.message}")
        }
    }
    
    fun getErrorMessage(code: Int?): String {
        return when (code) {
            400 -> "Bad request"
            401 -> "Unauthorized - Please login again"
            403 -> "Forbidden - You don't have permission"
            404 -> "Resource not found"
            500 -> "Server error - Please try again later"
            502 -> "Bad gateway"
            503 -> "Service unavailable"
            else -> "Unknown error occurred"
        }
    }
}

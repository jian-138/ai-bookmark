package com.example.aicollector.data.model

data class LoginResponse(
    val token: String,
    val userId: String,
    val expiresIn: Long
)

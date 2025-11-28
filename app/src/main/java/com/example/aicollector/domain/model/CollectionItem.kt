package com.example.aicollector.domain.model

data class CollectionItem(
    val id: String,
    val originalText: String,
    val keywords: List<String>,
    val category: String,
    val timestamp: Long,
    val userId: String
)

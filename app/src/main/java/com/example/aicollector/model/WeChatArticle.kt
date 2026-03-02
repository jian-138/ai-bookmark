package com.example.aicollector.model

data class WeChatArticle(
    val title: String,
    val url: String,
    val description: String,
    val coverImage: String?,
    val author: String?
)

data class ArticleParseRequest(val url: String)

data class CollectionRequest(
    val user_id: String,
    val original_text: String,
    val url: String?,
    val metadata: Map<String, String>?
)
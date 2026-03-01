package com.example.aicollector.data.model

import com.example.aicollector.domain.model.ArticleMetadata
import com.google.gson.annotations.SerializedName

data class CollectionRequest(
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("original_text")
    val originalText: String,
    @SerializedName("url")
    val url: String?,
    @SerializedName("metadata")
    val metadata: ArticleMetadata? = null
)

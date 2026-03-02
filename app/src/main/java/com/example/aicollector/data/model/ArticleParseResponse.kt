package com.example.aicollector.data.model

import com.google.gson.annotations.SerializedName

data class ArticleParseResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("title")
    val title: String,
    @SerializedName("content")
    val content: String,
    @SerializedName("author")
    val author: String,
    @SerializedName("publish_time")
    val publishTime: String,
    @SerializedName("cover_image")
    val coverImage: String?,
    @SerializedName("error")
    val error: String?
)

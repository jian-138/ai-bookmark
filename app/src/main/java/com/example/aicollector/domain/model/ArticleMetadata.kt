package com.example.aicollector.domain.model

import com.google.gson.annotations.SerializedName

data class ArticleMetadata(
    @SerializedName("title")
    val title: String,
    @SerializedName("source")
    val source: String = "wechat_official",
    @SerializedName("author")
    val author: String?,
    @SerializedName("publish_time")
    val publishTime: String?,
    @SerializedName("cover_image")
    val coverImage: String?
)

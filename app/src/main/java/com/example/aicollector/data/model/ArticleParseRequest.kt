package com.example.aicollector.data.model

import com.google.gson.annotations.SerializedName

data class ArticleParseRequest(
    @SerializedName("url")
    val url: String
)

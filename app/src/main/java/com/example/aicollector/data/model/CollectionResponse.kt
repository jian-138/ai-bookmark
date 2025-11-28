package com.example.aicollector.data.model

import com.google.gson.annotations.SerializedName

data class CollectionResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("collect_id")
    val collectId: String?,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("message")
    val message: String?,
    @SerializedName("code")
    val code: String?,
    @SerializedName("error")
    val error: String?
)

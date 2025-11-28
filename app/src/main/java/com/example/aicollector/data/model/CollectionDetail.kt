package com.example.aicollector.data.model

import com.google.gson.annotations.SerializedName

/**
 * 收藏详情数据模型（对应 GET /api/v1/collect/{collect_id} 响应）
 */
data class CollectionDetailResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: CollectionDetail?,
    @SerializedName("code")
    val code: String?,
    @SerializedName("error")
    val error: String?
)

data class CollectionDetail(
    @SerializedName("collect_id")
    val collectId: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("original_text")
    val originalText: String,
    @SerializedName("url")
    val url: String?,
    @SerializedName("ai_keywords")
    val aiKeywords: List<String>?,
    @SerializedName("ai_category")
    val aiCategory: String?,
    @SerializedName("summary")
    val summary: String?,
    @SerializedName("ai_confidence")
    val aiConfidence: Float?,
    @SerializedName("status")
    val status: String,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("updated_at")
    val updatedAt: String
)

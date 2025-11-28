package com.example.aicollector.data.model

import com.google.gson.annotations.SerializedName

/**
 * 收藏列表响应（用于列表查询接口）
 * 注意：此接口可能需要在API文档中补充定义
 */
data class CollectionListResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("items")
    val items: List<CollectionDetail>,
    @SerializedName("total_count")
    val totalCount: Int?,
    @SerializedName("page")
    val page: Int?,
    @SerializedName("page_size")
    val pageSize: Int?
)

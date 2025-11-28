package com.example.aicollector.data.remote

import com.example.aicollector.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    /**
     * 提交收藏 - 对应 POST /api/v1/collect
     */
    @POST("/api/v1/collect")
    suspend fun submitCollection(
        @Body request: CollectionRequest
    ): Response<CollectionResponse>
    
    /**
     * 查询单条收藏 - 对应 GET /api/v1/collect/{collect_id}
     */
    @GET("/api/v1/collect/{collect_id}")
    suspend fun getCollectionDetail(
        @Path("collect_id") collectId: String
    ): Response<CollectionDetailResponse>
    
    /**
     * 获取收藏列表（可能需要后续添加到API文档）
     */
    @GET("/api/v1/collections")
    suspend fun getCollections(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): Response<CollectionListResponse>
    
    /**
     * 搜索收藏（可能需要后续添加到API文档）
     */
    @GET("/api/v1/collections/search")
    suspend fun searchCollections(
        @Query("query") query: String,
        @Query("category") category: String?
    ): Response<CollectionListResponse>
    
    /**
     * 删除收藏（可能需要后续添加到API文档）
     */
    @DELETE("/api/v1/collections/{id}")
    suspend fun deleteCollection(
        @Path("id") id: String
    ): Response<Unit>
    
    /**
     * 用户登录（需要确认是否在API文档中）
     */
    @POST("/api/v1/auth/login")
    suspend fun login(
        @Body credentials: LoginRequest
    ): Response<LoginResponse>
}

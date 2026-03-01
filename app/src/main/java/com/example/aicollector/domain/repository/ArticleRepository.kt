package com.example.aicollector.domain.repository

import com.example.aicollector.data.model.ArticleParseResponse
import com.example.aicollector.data.model.CollectionResponse
import com.example.aicollector.domain.model.ArticleMetadata
import com.example.aicollector.util.NetworkResult

interface ArticleRepository {
    /**
     * 解析公众号文章
     * @param url 文章URL
     * @return 解析结果
     */
    suspend fun parseArticle(url: String): NetworkResult<ArticleParseResponse>
    
    /**
     * 提交文章收藏
     * @param content 文章内容
     * @param url 文章URL
     * @param metadata 文章元信息
     * @return 收藏结果
     */
    suspend fun collectArticle(
        content: String,
        url: String,
        metadata: ArticleMetadata
    ): NetworkResult<CollectionResponse>
    
    /**
     * 从缓存获取文章
     * @param url 文章URL
     * @return 缓存的解析结果，如果不存在或过期返回null
     */
    suspend fun getCachedArticle(url: String): ArticleParseResponse?
    
    /**
     * 缓存文章解析结果
     * @param url 文章URL
     * @param response 解析结果
     */
    suspend fun cacheArticle(url: String, response: ArticleParseResponse)
}

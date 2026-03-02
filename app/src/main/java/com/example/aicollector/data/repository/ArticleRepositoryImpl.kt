package com.example.aicollector.data.repository

import com.example.aicollector.data.local.dao.ArticleCacheDao
import com.example.aicollector.data.local.entity.ArticleCacheEntity
import com.example.aicollector.data.model.ArticleParseRequest
import com.example.aicollector.data.model.ArticleParseResponse
import com.example.aicollector.data.model.CollectionRequest
import com.example.aicollector.data.model.CollectionResponse
import com.example.aicollector.data.remote.ApiService
import com.example.aicollector.domain.model.ArticleMetadata
import com.example.aicollector.domain.repository.ArticleRepository
import com.example.aicollector.util.NetworkHelper
import com.example.aicollector.util.NetworkResult
import com.example.aicollector.util.TokenManager
import javax.inject.Inject

class ArticleRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val articleCacheDao: ArticleCacheDao,
    private val tokenManager: TokenManager
) : ArticleRepository {
    
    companion object {
        private const val CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000L // 24 hours
        private const val MAX_CACHE_SIZE = 50
    }
    
    override suspend fun parseArticle(url: String): NetworkResult<ArticleParseResponse> {
        val request = ArticleParseRequest(url = url)
        
        return when (val result = NetworkHelper.safeApiCall { 
            apiService.parseArticle(request) 
        }) {
            is NetworkResult.Success -> {
                val response = result.data
                if (response.success) {
                    NetworkResult.Success(response)
                } else {
                    NetworkResult.Error(response.error ?: "Failed to parse article")
                }
            }
            is NetworkResult.Error -> result
            is NetworkResult.Loading -> result
        }
    }
    
    override suspend fun collectArticle(
        content: String,
        url: String,
        metadata: ArticleMetadata
    ): NetworkResult<CollectionResponse> {
        val userId = tokenManager.getUserId() 
            ?: return NetworkResult.Error("User not authenticated")
        
        val request = CollectionRequest(
            userId = userId,
            originalText = content,
            url = url,
            metadata = metadata
        )
        
        return when (val result = NetworkHelper.safeApiCall { 
            apiService.submitCollection(request) 
        }) {
            is NetworkResult.Success -> {
                val response = result.data
                if (response.success) {
                    NetworkResult.Success(response)
                } else {
                    NetworkResult.Error(response.error ?: "Failed to collect article")
                }
            }
            is NetworkResult.Error -> result
            is NetworkResult.Loading -> result
        }
    }
    
    override suspend fun getCachedArticle(url: String): ArticleParseResponse? {
        val cached = articleCacheDao.getByUrl(url) ?: return null
        
        // Check if cache is expired
        val now = System.currentTimeMillis()
        if (now - cached.cachedAt > CACHE_EXPIRY_MS) {
            articleCacheDao.deleteByUrl(url)
            return null
        }
        
        return ArticleParseResponse(
            success = true,
            title = cached.title,
            content = cached.content,
            author = cached.author,
            publishTime = cached.publishTime,
            coverImage = cached.coverImage,
            error = null
        )
    }
    
    override suspend fun cacheArticle(url: String, response: ArticleParseResponse) {
        // Check cache size and evict oldest if necessary
        val cacheCount = articleCacheDao.getCount()
        if (cacheCount >= MAX_CACHE_SIZE) {
            val oldest = articleCacheDao.getOldest()
            oldest?.let { articleCacheDao.deleteByUrl(it.url) }
        }
        
        val entity = ArticleCacheEntity(
            url = url,
            title = response.title,
            content = response.content,
            author = response.author,
            publishTime = response.publishTime,
            coverImage = response.coverImage,
            cachedAt = System.currentTimeMillis()
        )
        
        articleCacheDao.insert(entity)
    }
}

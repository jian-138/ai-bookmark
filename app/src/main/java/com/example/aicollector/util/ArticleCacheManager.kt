package com.example.aicollector.util

import com.example.aicollector.data.local.dao.ArticleCacheDao
import com.example.aicollector.data.local.entity.ArticleCacheEntity
import com.example.aicollector.data.model.ArticleParseResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ArticleCacheManager @Inject constructor(
    private val articleCacheDao: ArticleCacheDao
) {
    companion object {
        private const val CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000L // 24 hours
        private const val MAX_CACHE_SIZE = 50
    }
    
    /**
     * 获取缓存的文章，如果不存在或已过期返回null
     */
    suspend fun get(url: String): ArticleParseResponse? {
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
    
    /**
     * 缓存文章解析结果
     */
    suspend fun put(url: String, response: ArticleParseResponse) {
        // Check cache size and evict oldest if necessary
        manageCacheSize()
        
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
    
    /**
     * 管理缓存大小，使用LRU策略
     */
    private suspend fun manageCacheSize() {
        val cacheCount = articleCacheDao.getCount()
        if (cacheCount >= MAX_CACHE_SIZE) {
            val oldest = articleCacheDao.getOldest()
            oldest?.let { articleCacheDao.deleteByUrl(it.url) }
        }
    }
    
    /**
     * 清理过期的缓存
     */
    suspend fun cleanExpired() {
        val expiryTime = System.currentTimeMillis() - CACHE_EXPIRY_MS
        articleCacheDao.deleteExpired(expiryTime)
    }
    
    /**
     * 清空所有缓存
     */
    suspend fun clearAll() {
        articleCacheDao.deleteAll()
    }
}

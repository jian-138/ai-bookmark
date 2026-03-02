package com.example.aicollector.data.local.dao

import androidx.room.*
import com.example.aicollector.data.local.entity.ArticleCacheEntity

@Dao
interface ArticleCacheDao {
    @Query("SELECT * FROM article_cache WHERE url = :url")
    suspend fun getByUrl(url: String): ArticleCacheEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(article: ArticleCacheEntity)
    
    @Query("DELETE FROM article_cache WHERE url = :url")
    suspend fun deleteByUrl(url: String)
    
    @Query("SELECT COUNT(*) FROM article_cache")
    suspend fun getCount(): Int
    
    @Query("SELECT * FROM article_cache ORDER BY cachedAt ASC LIMIT 1")
    suspend fun getOldest(): ArticleCacheEntity?
    
    @Query("DELETE FROM article_cache WHERE cachedAt < :expiryTime")
    suspend fun deleteExpired(expiryTime: Long)
    
    @Query("DELETE FROM article_cache")
    suspend fun deleteAll()
}

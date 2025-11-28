package com.example.aicollector.util

import com.example.aicollector.data.local.dao.CollectionDao
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CacheManager @Inject constructor(
    private val collectionDao: CollectionDao
) {
    suspend fun checkCacheSize(userId: String): Long {
        return collectionDao.getCollectionCount(userId).toLong()
    }
    
    suspend fun clearOldCache(userId: String, maxSize: Int = MAX_CACHE_SIZE) {
        val currentSize = collectionDao.getCollectionCount(userId)
        
        if (currentSize > maxSize) {
            // Get oldest items to delete
            val itemsToDelete = currentSize - maxSize
            val oldestItems = collectionDao.getCollectionsPaged(
                userId = userId,
                limit = itemsToDelete,
                offset = 0
            )
            
            oldestItems.forEach { item ->
                collectionDao.deleteCollectionById(item.id)
            }
        }
    }
    
    suspend fun clearAllCache(userId: String) {
        collectionDao.deleteAllCollections(userId)
    }
    
    companion object {
        const val MAX_CACHE_SIZE = 1000 // Maximum number of cached items
    }
}

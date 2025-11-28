package com.example.aicollector.data.local.dao

import androidx.room.*
import com.example.aicollector.data.local.entity.CollectionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CollectionDao {
    @Query("SELECT * FROM collections WHERE userId = :userId ORDER BY timestamp DESC")
    fun getCollections(userId: String): Flow<List<CollectionEntity>>
    
    @Query("SELECT * FROM collections WHERE userId = :userId ORDER BY timestamp DESC LIMIT :limit OFFSET :offset")
    suspend fun getCollectionsPaged(userId: String, limit: Int, offset: Int): List<CollectionEntity>
    
    @Query("SELECT * FROM collections WHERE id = :id")
    suspend fun getCollectionById(id: String): CollectionEntity?
    
    @Query("SELECT * FROM collections WHERE userId = :userId AND category = :category ORDER BY timestamp DESC")
    suspend fun getCollectionsByCategory(userId: String, category: String): List<CollectionEntity>
    
    @Query("SELECT * FROM collections WHERE userId = :userId AND (originalText LIKE '%' || :query || '%' OR keywords LIKE '%' || :query || '%') ORDER BY timestamp DESC")
    suspend fun searchCollections(userId: String, query: String): List<CollectionEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCollection(collection: CollectionEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCollections(collections: List<CollectionEntity>)
    
    @Delete
    suspend fun deleteCollection(collection: CollectionEntity)
    
    @Query("DELETE FROM collections WHERE id = :id")
    suspend fun deleteCollectionById(id: String)
    
    @Query("DELETE FROM collections WHERE userId = :userId")
    suspend fun deleteAllCollections(userId: String)
    
    @Query("SELECT COUNT(*) FROM collections WHERE userId = :userId")
    suspend fun getCollectionCount(userId: String): Int
}

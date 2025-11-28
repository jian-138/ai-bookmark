package com.example.aicollector.data.local.dao

import androidx.room.*
import com.example.aicollector.data.local.entity.PendingCollectionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PendingCollectionDao {
    @Query("SELECT * FROM pending_collections ORDER BY timestamp ASC")
    fun getAllPending(): Flow<List<PendingCollectionEntity>>
    
    @Query("SELECT * FROM pending_collections ORDER BY timestamp ASC")
    suspend fun getAllPendingList(): List<PendingCollectionEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPending(pending: PendingCollectionEntity): Long
    
    @Delete
    suspend fun deletePending(pending: PendingCollectionEntity)
    
    @Query("DELETE FROM pending_collections WHERE id = :id")
    suspend fun deletePendingById(id: Long)
    
    @Query("UPDATE pending_collections SET retryCount = :retryCount WHERE id = :id")
    suspend fun updateRetryCount(id: Long, retryCount: Int)
    
    @Query("DELETE FROM pending_collections")
    suspend fun deleteAllPending()
}

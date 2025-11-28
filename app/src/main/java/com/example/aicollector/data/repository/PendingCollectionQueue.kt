package com.example.aicollector.data.repository

import com.example.aicollector.data.local.dao.PendingCollectionDao
import com.example.aicollector.data.local.entity.PendingCollectionEntity
import com.example.aicollector.data.model.CollectionRequest
import com.example.aicollector.data.remote.ApiService
import com.example.aicollector.util.NetworkHelper
import com.example.aicollector.util.NetworkResult
import com.example.aicollector.util.TokenManager
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PendingCollectionQueue @Inject constructor(
    private val pendingDao: PendingCollectionDao,
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    fun getPendingCollections(): Flow<List<PendingCollectionEntity>> {
        return pendingDao.getAllPending()
    }
    
    suspend fun enqueue(text: String, source: String?) {
        val pending = PendingCollectionEntity(
            text = text,
            source = source,
            timestamp = System.currentTimeMillis(),
            retryCount = 0
        )
        pendingDao.insertPending(pending)
    }
    
    suspend fun syncPending(): Int {
        val userId = tokenManager.getUserId() ?: return 0
        val pendingList = pendingDao.getAllPendingList()
        var successCount = 0
        
        for (pending in pendingList) {
            val request = CollectionRequest(
                userId = userId,
                originalText = pending.text,
                url = pending.source
            )
            
            when (val result = NetworkHelper.safeApiCall { apiService.submitCollection(request) }) {
                is NetworkResult.Success -> {
                    val response = result.data
                    if (response.success) {
                        pendingDao.deletePendingById(pending.id)
                        successCount++
                    } else {
                        // Increment retry count on failure
                        val newRetryCount = pending.retryCount + 1
                        if (newRetryCount >= MAX_RETRY_COUNT) {
                            pendingDao.deletePendingById(pending.id)
                        } else {
                            pendingDao.updateRetryCount(pending.id, newRetryCount)
                        }
                    }
                }
                is NetworkResult.Error -> {
                    // Increment retry count
                    val newRetryCount = pending.retryCount + 1
                    if (newRetryCount >= MAX_RETRY_COUNT) {
                        // Delete after max retries
                        pendingDao.deletePendingById(pending.id)
                    } else {
                        pendingDao.updateRetryCount(pending.id, newRetryCount)
                    }
                }
                else -> {}
            }
        }
        
        return successCount
    }
    
    suspend fun clearAll() {
        pendingDao.deleteAllPending()
    }
    
    companion object {
        private const val MAX_RETRY_COUNT = 3
    }
}

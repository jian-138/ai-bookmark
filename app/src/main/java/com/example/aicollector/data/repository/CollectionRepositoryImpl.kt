package com.example.aicollector.data.repository

import com.example.aicollector.data.local.dao.CollectionDao
import com.example.aicollector.data.mapper.CollectionMapper.toDomain
import com.example.aicollector.data.mapper.CollectionMapper.toEntity
import com.example.aicollector.data.model.CollectionRequest
import com.example.aicollector.data.remote.ApiService
import com.example.aicollector.domain.model.CollectionItem
import com.example.aicollector.domain.repository.CollectionRepository
import com.example.aicollector.util.NetworkHelper
import com.example.aicollector.util.NetworkMonitor
import com.example.aicollector.util.NetworkResult
import com.example.aicollector.util.TokenManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class CollectionRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val collectionDao: CollectionDao,
    private val pendingQueue: PendingCollectionQueue,
    private val tokenManager: TokenManager,
    private val networkMonitor: NetworkMonitor
) : CollectionRepository {
    
    override suspend fun submitCollection(text: String, source: String?): NetworkResult<CollectionItem> {
        // Validate input
        if (text.isBlank() || text.trim().isEmpty()) {
            return NetworkResult.Error("Text cannot be empty or whitespace only")
        }
        
        val userId = tokenManager.getUserId() ?: return NetworkResult.Error("User not authenticated")
        
        // Check network availability
        if (!networkMonitor.isNetworkAvailable()) {
            pendingQueue.enqueue(text, source)
            return NetworkResult.Error("No network connection. Item queued for later sync.")
        }
        
        val request = CollectionRequest(
            userId = userId,
            originalText = text,
            url = source
        )
        
        return when (val result = NetworkHelper.safeApiCall { apiService.submitCollection(request) }) {
            is NetworkResult.Success -> {
                val response = result.data
                
                // Check if request was successful
                if (!response.success) {
                    return NetworkResult.Error(response.error ?: response.message ?: "Unknown error")
                }
                
                val collectId = response.collectId ?: return NetworkResult.Error("No collect_id returned")
                
                val item = CollectionItem(
                    id = collectId,
                    originalText = text,
                    keywords = emptyList(), // Will be filled by AI later
                    category = "", // Will be filled by AI later
                    timestamp = System.currentTimeMillis(),
                    userId = userId
                )
                
                // Cache locally
                collectionDao.insertCollection(item.toEntity(synced = true))
                
                NetworkResult.Success(item)
            }
            is NetworkResult.Error -> {
                // Queue for later if network error
                pendingQueue.enqueue(text, source)
                result
            }
            is NetworkResult.Loading -> NetworkResult.Loading
        }
    }
    
    override suspend fun getCollections(page: Int, pageSize: Int): NetworkResult<List<CollectionItem>> {
        val userId = tokenManager.getUserId() ?: return NetworkResult.Error("User not authenticated")
        
        return when (val result = NetworkHelper.safeApiCall { apiService.getCollections(page, pageSize) }) {
            is NetworkResult.Success -> {
                val response = result.data
                
                if (!response.success) {
                    return NetworkResult.Error("Failed to fetch collections")
                }
                
                val items = response.items.map { detail ->
                    CollectionItem(
                        id = detail.collectId,
                        originalText = detail.originalText,
                        keywords = detail.aiKeywords ?: emptyList(),
                        category = detail.aiCategory ?: "",
                        timestamp = System.currentTimeMillis(), // Could parse createdAt if needed
                        userId = userId
                    )
                }
                
                // Update cache
                if (page == 0) {
                    collectionDao.insertCollections(items.map { it.toEntity(synced = true) })
                }
                
                NetworkResult.Success(items)
            }
            is NetworkResult.Error -> {
                // Return cached data if available
                val cached = getCachedCollections()
                if (cached.isNotEmpty()) {
                    NetworkResult.Success(cached)
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> NetworkResult.Loading
        }
    }
    
    override suspend fun searchCollections(query: String, category: String?): NetworkResult<List<CollectionItem>> {
        val userId = tokenManager.getUserId() ?: return NetworkResult.Error("User not authenticated")
        
        return when (val result = NetworkHelper.safeApiCall { apiService.searchCollections(query, category) }) {
            is NetworkResult.Success -> {
                val response = result.data
                
                if (!response.success) {
                    return NetworkResult.Error("Search failed")
                }
                
                val items = response.items.map { detail ->
                    CollectionItem(
                        id = detail.collectId,
                        originalText = detail.originalText,
                        keywords = detail.aiKeywords ?: emptyList(),
                        category = detail.aiCategory ?: "",
                        timestamp = System.currentTimeMillis(),
                        userId = userId
                    )
                }
                NetworkResult.Success(items)
            }
            is NetworkResult.Error -> {
                // Search in local cache
                val cached = collectionDao.searchCollections(userId, query)
                NetworkResult.Success(cached.map { it.toDomain() })
            }
            is NetworkResult.Loading -> NetworkResult.Loading
        }
    }
    
    override suspend fun deleteCollection(id: String): NetworkResult<Unit> {
        return when (val result = NetworkHelper.safeApiCall { apiService.deleteCollection(id) }) {
            is NetworkResult.Success -> {
                collectionDao.deleteCollectionById(id)
                NetworkResult.Success(Unit)
            }
            is NetworkResult.Error -> result
            is NetworkResult.Loading -> NetworkResult.Loading
        }
    }
    
    override fun observeCollections(): Flow<List<CollectionItem>> {
        val userId = tokenManager.getUserId() ?: return kotlinx.coroutines.flow.flowOf(emptyList())
        return collectionDao.getCollections(userId).map { entities ->
            entities.map { it.toDomain() }
        }
    }
    
    override suspend fun getCachedCollections(): List<CollectionItem> {
        val userId = tokenManager.getUserId() ?: return emptyList()
        return collectionDao.getCollectionsPaged(userId, 100, 0).map { it.toDomain() }
    }
}

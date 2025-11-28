package com.example.aicollector.domain.repository

import com.example.aicollector.domain.model.CollectionItem
import com.example.aicollector.util.NetworkResult
import kotlinx.coroutines.flow.Flow

interface CollectionRepository {
    suspend fun submitCollection(text: String, source: String? = null): NetworkResult<CollectionItem>
    suspend fun getCollections(page: Int, pageSize: Int = 20): NetworkResult<List<CollectionItem>>
    suspend fun searchCollections(query: String, category: String? = null): NetworkResult<List<CollectionItem>>
    suspend fun deleteCollection(id: String): NetworkResult<Unit>
    fun observeCollections(): Flow<List<CollectionItem>>
    suspend fun getCachedCollections(): List<CollectionItem>
}

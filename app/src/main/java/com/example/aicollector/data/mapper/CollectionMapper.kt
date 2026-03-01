package com.example.aicollector.data.mapper

import com.example.aicollector.data.local.entity.CollectionEntity
import com.example.aicollector.data.model.CollectionResponse
import com.example.aicollector.domain.model.ArticleMetadata
import com.example.aicollector.domain.model.CollectionItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object CollectionMapper {
    private val gson = Gson()
    
    fun CollectionEntity.toDomain(): CollectionItem {
        val keywordsList = try {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson<List<String>>(keywords, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
        
        val metadataObj = try {
            if (!metadataJson.isNullOrBlank()) {
                gson.fromJson(metadataJson, ArticleMetadata::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
        
        return CollectionItem(
            id = id,
            originalText = originalText,
            keywords = keywordsList,
            category = category,
            timestamp = timestamp,
            userId = userId,
            url = url,
            metadata = metadataObj,
            summary = summary
        )
    }
    
    fun CollectionItem.toEntity(synced: Boolean = true): CollectionEntity {
        val metadataJsonStr = try {
            if (metadata != null) {
                gson.toJson(metadata)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
        
        return CollectionEntity(
            id = id,
            originalText = originalText,
            keywords = gson.toJson(keywords),
            category = category,
            timestamp = timestamp,
            userId = userId,
            synced = synced,
            url = url,
            metadataJson = metadataJsonStr,
            summary = summary
        )
    }
    
    // CollectionResponse mapping removed - response no longer contains keywords/category
    // Use CollectionDetail for full collection data with AI results
}

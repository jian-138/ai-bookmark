package com.example.aicollector.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "article_cache")
data class ArticleCacheEntity(
    @PrimaryKey
    val url: String,
    val title: String,
    val content: String,
    val author: String,
    val publishTime: String,
    val coverImage: String?,
    val cachedAt: Long = System.currentTimeMillis()
)

package com.example.aicollector.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "collections")
data class CollectionEntity(
    @PrimaryKey val id: String,
    val originalText: String,
    val keywords: String, // JSON array stored as string
    val category: String,
    val timestamp: Long,
    val userId: String,
    val synced: Boolean
)

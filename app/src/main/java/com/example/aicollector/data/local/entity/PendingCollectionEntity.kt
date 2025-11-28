package com.example.aicollector.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_collections")
data class PendingCollectionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val text: String,
    val source: String?,
    val timestamp: Long,
    val retryCount: Int
)

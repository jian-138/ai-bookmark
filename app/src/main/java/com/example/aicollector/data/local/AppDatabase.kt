package com.example.aicollector.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.aicollector.data.local.dao.ArticleCacheDao
import com.example.aicollector.data.local.dao.CollectionDao
import com.example.aicollector.data.local.dao.PendingCollectionDao
import com.example.aicollector.data.local.entity.ArticleCacheEntity
import com.example.aicollector.data.local.entity.CollectionEntity
import com.example.aicollector.data.local.entity.PendingCollectionEntity

@Database(
    entities = [
        CollectionEntity::class,
        PendingCollectionEntity::class,
        ArticleCacheEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun collectionDao(): CollectionDao
    abstract fun pendingCollectionDao(): PendingCollectionDao
    abstract fun articleCacheDao(): ArticleCacheDao
}

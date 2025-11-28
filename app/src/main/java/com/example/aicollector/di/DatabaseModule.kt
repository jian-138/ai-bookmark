package com.example.aicollector.di

import android.content.Context
import androidx.room.Room
import com.example.aicollector.data.local.AppDatabase
import com.example.aicollector.data.local.dao.CollectionDao
import com.example.aicollector.data.local.dao.PendingCollectionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "ai_collector_database"
        )
            .fallbackToDestructiveMigration()
            .build()
    }
    
    @Provides
    @Singleton
    fun provideCollectionDao(database: AppDatabase): CollectionDao {
        return database.collectionDao()
    }
    
    @Provides
    @Singleton
    fun providePendingCollectionDao(database: AppDatabase): PendingCollectionDao {
        return database.pendingCollectionDao()
    }
}

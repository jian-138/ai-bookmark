package com.example.aicollector.di

import com.example.aicollector.data.repository.AuthRepositoryImpl
import com.example.aicollector.data.repository.CollectionRepositoryImpl
import com.example.aicollector.domain.repository.AuthRepository
import com.example.aicollector.domain.repository.CollectionRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    
    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository
    
    @Binds
    @Singleton
    abstract fun bindCollectionRepository(
        collectionRepositoryImpl: CollectionRepositoryImpl
    ): CollectionRepository
}

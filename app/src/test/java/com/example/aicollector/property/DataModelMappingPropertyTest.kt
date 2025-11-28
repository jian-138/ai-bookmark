package com.example.aicollector.property

import com.example.aicollector.data.local.entity.CollectionEntity
import com.example.aicollector.data.mapper.CollectionMapper.toDomain
import com.example.aicollector.data.mapper.CollectionMapper.toEntity
import com.google.gson.Gson
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.property.Arb
import io.kotest.property.arbitrary.*
import io.kotest.property.checkAll

/**
 * Feature: ai-collector-frontend, Property: Round trip consistency for entity-to-model conversion
 * Validates: Requirements 4.2
 * 
 * Property: For any CollectionEntity, converting to domain model and back to entity
 * should preserve all data (round trip consistency)
 */
class DataModelMappingPropertyTest : StringSpec({
    val gson = Gson()
    
    // Generator for CollectionEntity
    val collectionEntityArb = arbitrary {
        val keywords = Arb.list(Arb.string(1..20), 0..10).bind()
        CollectionEntity(
            id = Arb.uuid().bind().toString(),
            originalText = Arb.string(10..500).bind(),
            keywords = gson.toJson(keywords),
            category = Arb.choice(
                Arb.constant("技术"),
                Arb.constant("生活"),
                Arb.constant("工作"),
                Arb.constant("学习"),
                Arb.constant("其他")
            ).bind(),
            timestamp = Arb.long(1000000000000L..2000000000000L).bind(),
            userId = Arb.uuid().bind().toString(),
            synced = Arb.bool().bind()
        )
    }
    
    "Round trip: Entity -> Domain -> Entity should preserve data" {
        checkAll(100, collectionEntityArb) { originalEntity ->
            // Convert entity to domain model
            val domainModel = originalEntity.toDomain()
            
            // Convert domain model back to entity
            val convertedEntity = domainModel.toEntity(originalEntity.synced)
            
            // Verify all fields are preserved
            convertedEntity.id shouldBe originalEntity.id
            convertedEntity.originalText shouldBe originalEntity.originalText
            convertedEntity.keywords shouldBe originalEntity.keywords
            convertedEntity.category shouldBe originalEntity.category
            convertedEntity.timestamp shouldBe originalEntity.timestamp
            convertedEntity.userId shouldBe originalEntity.userId
            convertedEntity.synced shouldBe originalEntity.synced
        }
    }
    
    "Keywords JSON serialization should be consistent" {
        checkAll(100, Arb.list(Arb.string(1..50), 0..20)) { keywords ->
            val entity = CollectionEntity(
                id = "test-id",
                originalText = "test text",
                keywords = gson.toJson(keywords),
                category = "test",
                timestamp = System.currentTimeMillis(),
                userId = "user-id",
                synced = true
            )
            
            val domainModel = entity.toDomain()
            domainModel.keywords shouldBe keywords
            
            val convertedEntity = domainModel.toEntity(true)
            convertedEntity.keywords shouldBe gson.toJson(keywords)
        }
    }
    
    "Empty keywords list should be handled correctly" {
        val entity = CollectionEntity(
            id = "test-id",
            originalText = "test text",
            keywords = gson.toJson(emptyList<String>()),
            category = "test",
            timestamp = System.currentTimeMillis(),
            userId = "user-id",
            synced = true
        )
        
        val domainModel = entity.toDomain()
        domainModel.keywords shouldBe emptyList()
        
        val convertedEntity = domainModel.toEntity(true)
        convertedEntity.keywords shouldBe gson.toJson(emptyList<String>())
    }
    
    "Invalid JSON in keywords should result in empty list" {
        val entity = CollectionEntity(
            id = "test-id",
            originalText = "test text",
            keywords = "invalid json",
            category = "test",
            timestamp = System.currentTimeMillis(),
            userId = "user-id",
            synced = true
        )
        
        val domainModel = entity.toDomain()
        domainModel.keywords shouldBe emptyList()
    }
})

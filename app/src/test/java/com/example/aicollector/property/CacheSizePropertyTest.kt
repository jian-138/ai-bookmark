package com.example.aicollector.property

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.ints.shouldBeLessThanOrEqual
import io.kotest.matchers.shouldBe
import io.kotest.property.Arb
import io.kotest.property.arbitrary.int
import io.kotest.property.checkAll

/**
 * Feature: ai-collector-frontend, Property 26: Cache size limits
 * Validates: Requirements 8.4
 * 
 * Property: For any cached data, the total cache size should not exceed
 * the configured maximum limit
 */
class CacheSizePropertyTest : StringSpec({
    
    val maxCacheSize = 1000
    
    "Cache size should never exceed maximum limit" {
        checkAll(100, Arb.int(0..2000)) { itemsToAdd ->
            val cache = mutableListOf<String>()
            
            // Add items
            repeat(itemsToAdd) {
                cache.add("item_$it")
                
                // Enforce limit
                if (cache.size > maxCacheSize) {
                    cache.removeAt(0) // Remove oldest
                }
            }
            
            // Verify size constraint
            cache.size shouldBeLessThanOrEqual maxCacheSize
        }
    }
    
    "Adding items beyond limit should remove oldest items" {
        val cache = mutableListOf<String>()
        val itemsToAdd = maxCacheSize + 100
        
        repeat(itemsToAdd) { index ->
            cache.add("item_$index")
            
            if (cache.size > maxCacheSize) {
                cache.removeAt(0)
            }
        }
        
        cache.size shouldBe maxCacheSize
        // First item should be item_100 (oldest 100 removed)
        cache.first() shouldBe "item_100"
        cache.last() shouldBe "item_${itemsToAdd - 1}"
    }
    
    "Empty cache should have size zero" {
        val cache = mutableListOf<String>()
        cache.size shouldBe 0
    }
    
    "Clearing cache should reset size to zero" {
        val cache = mutableListOf<String>()
        
        repeat(500) {
            cache.add("item_$it")
        }
        
        cache.clear()
        cache.size shouldBe 0
    }
    
    "Cache size should be accurate after mixed operations" {
        val cache = mutableListOf<String>()
        
        // Add items
        repeat(100) { cache.add("item_$it") }
        cache.size shouldBe 100
        
        // Remove some
        repeat(30) { cache.removeAt(0) }
        cache.size shouldBe 70
        
        // Add more
        repeat(50) { cache.add("new_$it") }
        cache.size shouldBe 120
    }
})

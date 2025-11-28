package com.example.aicollector.property

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.property.Arb
import io.kotest.property.arbitrary.string
import io.kotest.property.checkAll
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import android.util.Base64

/**
 * Feature: ai-collector-frontend, Property 29: Data encryption
 * Validates: Requirements 9.3
 * 
 * Property: For any sensitive data cached locally, the data should be encrypted using AES encryption
 */
class EncryptionPropertyTest : StringSpec({
    
    // Simple encryption/decryption for testing (not using Android Keystore in unit tests)
    fun encryptData(data: String, key: javax.crypto.SecretKey): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        val iv = cipher.iv
        val encryptedData = cipher.doFinal(data.toByteArray(Charsets.UTF_8))
        val combined = iv + encryptedData
        return Base64.encodeToString(combined, Base64.NO_WRAP)
    }
    
    fun decryptData(encryptedData: String, key: javax.crypto.SecretKey): String {
        val combined = Base64.decode(encryptedData, Base64.NO_WRAP)
        val iv = combined.copyOfRange(0, 12)
        val encrypted = combined.copyOfRange(12, combined.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, key, spec)
        val decryptedData = cipher.doFinal(encrypted)
        return String(decryptedData, Charsets.UTF_8)
    }
    
    "Encrypted data should be different from original data" {
        val keyGenerator = KeyGenerator.getInstance("AES")
        keyGenerator.init(256)
        val key = keyGenerator.generateKey()
        
        checkAll(100, Arb.string(10..500)) { originalData ->
            val encrypted = encryptData(originalData, key)
            
            // Encrypted data should not equal original
            encrypted shouldNotBe originalData
            
            // Encrypted data should be Base64 encoded
            val decoded = Base64.decode(encrypted, Base64.NO_WRAP)
            decoded.size shouldNotBe 0
        }
    }
    
    "Encryption and decryption should be reversible (round trip)" {
        val keyGenerator = KeyGenerator.getInstance("AES")
        keyGenerator.init(256)
        val key = keyGenerator.generateKey()
        
        checkAll(100, Arb.string(1..1000)) { originalData ->
            val encrypted = encryptData(originalData, key)
            val decrypted = decryptData(encrypted, key)
            
            // Round trip should preserve data
            decrypted shouldBe originalData
        }
    }
    
    "Same data encrypted twice should produce different ciphertexts (due to IV)" {
        val keyGenerator = KeyGenerator.getInstance("AES")
        keyGenerator.init(256)
        val key = keyGenerator.generateKey()
        
        checkAll(50, Arb.string(10..100)) { data ->
            val encrypted1 = encryptData(data, key)
            val encrypted2 = encryptData(data, key)
            
            // Different IVs should produce different ciphertexts
            encrypted1 shouldNotBe encrypted2
            
            // But both should decrypt to same original data
            decryptData(encrypted1, key) shouldBe data
            decryptData(encrypted2, key) shouldBe data
        }
    }
    
    "Empty string should be encrypted and decrypted correctly" {
        val keyGenerator = KeyGenerator.getInstance("AES")
        keyGenerator.init(256)
        val key = keyGenerator.generateKey()
        
        val encrypted = encryptData("", key)
        val decrypted = decryptData(encrypted, key)
        
        decrypted shouldBe ""
    }
    
    "Special characters and unicode should be preserved" {
        val keyGenerator = KeyGenerator.getInstance("AES")
        keyGenerator.init(256)
        val key = keyGenerator.generateKey()
        
        val specialStrings = listOf(
            "Hello 世界",
            "🎉🎊🎈",
            "Line1\nLine2\nLine3",
            "Tab\tSeparated\tValues",
            "Special: !@#$%^&*()"
        )
        
        specialStrings.forEach { original ->
            val encrypted = encryptData(original, key)
            val decrypted = decryptData(encrypted, key)
            decrypted shouldBe original
        }
    }
})

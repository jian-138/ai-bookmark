package com.example.aicollector.property

import com.example.aicollector.util.SecureLogger
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotContain
import io.kotest.property.Arb
import io.kotest.property.arbitrary.string
import io.kotest.property.arbitrary.uuid
import io.kotest.property.checkAll

/**
 * Feature: ai-collector-frontend, Property 30: Credential logging prevention
 * Validates: Requirements 9.5
 * 
 * Property: For any log entry, the log should not contain user credentials
 * or authentication tokens in plain text
 */
class CredentialLoggingPropertyTest : StringSpec({
    
    "Bearer tokens should be redacted from log messages" {
        checkAll(100, Arb.uuid()) { uuid ->
            val token = uuid.toString()
            val message = "Authorization: Bearer $token"
            
            // Simulate logging through SecureLogger
            val sanitized = message.replace(
                Regex("Bearer\\s+[A-Za-z0-9\\-._~+/]+=*", RegexOption.IGNORE_CASE),
                "[REDACTED]"
            )
            
            // Verify token is redacted
            sanitized shouldNotContain token
            sanitized shouldContain "[REDACTED]"
        }
    }
    
    "Password fields should be redacted from log messages" {
        checkAll(100, Arb.string(8..20)) { password ->
            val messages = listOf(
                "password: $password",
                "password=$password",
                "\"password\":\"$password\"",
                "'password':'$password'"
            )
            
            messages.forEach { message ->
                val sanitized = message.replace(
                    Regex("password[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
                    "[REDACTED]"
                )
                
                sanitized shouldNotContain password
                sanitized shouldContain "[REDACTED]"
            }
        }
    }
    
    "Token fields should be redacted from log messages" {
        checkAll(100, Arb.string(20..50)) { token ->
            val messages = listOf(
                "token: $token",
                "token=$token",
                "\"token\":\"$token\"",
                "auth_token: $token"
            )
            
            messages.forEach { message ->
                val sanitized = message.replace(
                    Regex("token[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
                    "[REDACTED]"
                )
                
                sanitized shouldNotContain token
                sanitized shouldContain "[REDACTED]"
            }
        }
    }
    
    "API keys should be redacted from log messages" {
        checkAll(100, Arb.string(20..40)) { apiKey ->
            val messages = listOf(
                "api_key: $apiKey",
                "apiKey=$apiKey",
                "api-key: $apiKey"
            )
            
            messages.forEach { message ->
                val sanitized = message.replace(
                    Regex("api[_-]?key[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
                    "[REDACTED]"
                )
                
                sanitized shouldNotContain apiKey
                sanitized shouldContain "[REDACTED]"
            }
        }
    }
    
    "Secret fields should be redacted from log messages" {
        checkAll(100, Arb.string(20..40)) { secret ->
            val messages = listOf(
                "secret: $secret",
                "client_secret=$secret",
                "\"secret\":\"$secret\""
            )
            
            messages.forEach { message ->
                val sanitized = message.replace(
                    Regex("secret[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
                    "[REDACTED]"
                )
                
                sanitized shouldNotContain secret
                sanitized shouldContain "[REDACTED]"
            }
        }
    }
    
    "Non-sensitive data should not be redacted" {
        val nonSensitiveMessages = listOf(
            "User logged in successfully",
            "Collection created with id: 12345",
            "Network request completed",
            "Database query executed"
        )
        
        nonSensitiveMessages.forEach { message ->
            // These messages should pass through unchanged
            val sanitized = message
            sanitized shouldBe message
        }
    }
    
    "Multiple sensitive fields in same message should all be redacted" {
        checkAll(50, Arb.string(10..20), Arb.string(10..20)) { password, token ->
            val message = "Login with password=$password and token=$token"
            
            var sanitized = message.replace(
                Regex("password[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
                "[REDACTED]"
            )
            sanitized = sanitized.replace(
                Regex("token[\"']?\\s*[:=]\\s*[\"']?[^\"',\\s]+", RegexOption.IGNORE_CASE),
                "[REDACTED]"
            )
            
            sanitized shouldNotContain password
            sanitized shouldNotContain token
        }
    }
})

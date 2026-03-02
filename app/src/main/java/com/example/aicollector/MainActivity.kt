package com.example.aicollector

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.aicollector.presentation.theme.AICollectorTheme
import com.example.aicollector.presentation.ui.CollectionListScreen
import com.example.aicollector.presentation.ui.LoginScreen
import com.example.aicollector.util.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var tokenManager: TokenManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Start foreground service
        startCollectorService()
        
        setContent {
            AICollectorTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    // 处理分享intent
                    val sharedUrl = if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
                        intent.getStringExtra(Intent.EXTRA_TEXT)
                    } else {
                        null
                    }
                    
                    // 使用remember来避免重复调用
                    val isAuthenticated = remember { tokenManager.isAuthenticated() }
                    
                    AppNavigation(
                        isAuthenticated = isAuthenticated,
                        sharedUrl = sharedUrl
                    )
                }
            }
        }
    }
    
    private fun startCollectorService() {
        val serviceIntent = android.content.Intent(this, com.example.aicollector.service.CollectorForegroundService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
}

@Composable
fun AppNavigation(isAuthenticated: Boolean, sharedUrl: String? = null) {
    val navController = rememberNavController()
    val startDestination = if (isAuthenticated) {
        if (sharedUrl != null) "article_collect" else "collection_list"
    } else {
        "login"
    }
    
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("collection_list") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        
        composable("collection_list") {
            CollectionListScreen(
                onItemClick = { id ->
                    navController.navigate("collection_detail/$id")
                },
                onAddArticle = {
                    navController.navigate("article_collect")
                }
            )
        }
        
        composable("article_collect") {
            com.example.aicollector.presentation.ui.ArticleCollectScreen(
                initialUrl = sharedUrl,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onCollectSuccess = {
                    navController.navigate("collection_list") {
                        popUpTo("article_collect") { inclusive = true }
                    }
                }
            )
        }
        
        composable("collection_detail/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id") ?: ""
            // TODO: Load collection item and show detail
            Surface {
                androidx.compose.material3.Text("Detail: $id")
            }
        }
    }
}

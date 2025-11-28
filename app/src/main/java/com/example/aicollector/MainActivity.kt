package com.example.aicollector

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
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
                    AppNavigation(isAuthenticated = tokenManager.isAuthenticated())
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
fun AppNavigation(isAuthenticated: Boolean) {
    val navController = rememberNavController()
    val startDestination = if (isAuthenticated) "collection_list" else "login"
    
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
                }
            )
        }
        
        composable("collection_detail/{id}") { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id") ?: ""
            // TODO: Implement detail screen
            Surface {
                androidx.compose.material3.Text("Detail: $id")
            }
        }
    }
}

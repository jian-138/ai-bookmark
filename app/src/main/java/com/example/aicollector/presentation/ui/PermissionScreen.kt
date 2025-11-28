package com.example.aicollector.presentation.ui

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.aicollector.service.TextCaptureAccessibilityService
import com.example.aicollector.util.PermissionHelper

@Composable
fun PermissionScreen(
    onPermissionsGranted: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity
    
    var hasOverlay by remember { mutableStateOf(PermissionHelper.hasOverlayPermission(context)) }
    var hasNotification by remember { mutableStateOf(PermissionHelper.hasNotificationPermission(context)) }
    var hasBatteryOptimization by remember { mutableStateOf(PermissionHelper.isIgnoringBatteryOptimizations(context)) }
    var hasAccessibility by remember { mutableStateOf(PermissionHelper.isAccessibilityServiceEnabled(context, TextCaptureAccessibilityService::class.java)) }
    
    LaunchedEffect(Unit) {
        // Check permissions periodically
        kotlinx.coroutines.delay(1000)
        hasOverlay = PermissionHelper.hasOverlayPermission(context)
        hasNotification = PermissionHelper.hasNotificationPermission(context)
        hasBatteryOptimization = PermissionHelper.isIgnoringBatteryOptimizations(context)
        hasAccessibility = PermissionHelper.isAccessibilityServiceEnabled(context, TextCaptureAccessibilityService::class.java)
        
        if (hasOverlay && hasNotification && hasBatteryOptimization && hasAccessibility) {
            onPermissionsGranted()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "需要以下权限",
            style = MaterialTheme.typography.headlineMedium
        )
        
        Text(
            text = "为了正常使用AI收藏夹，需要授予以下权限：",
            style = MaterialTheme.typography.bodyMedium
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        PermissionItem(
            title = "悬浮窗权限",
            description = "用于显示收藏按钮",
            isGranted = hasOverlay,
            onRequest = {
                activity?.let { PermissionHelper.requestOverlayPermission(it) }
            }
        )
        
        PermissionItem(
            title = "通知权限",
            description = "用于显示收藏状态通知",
            isGranted = hasNotification,
            onRequest = {
                activity?.let { PermissionHelper.requestNotificationPermission(it) }
            }
        )
        
        PermissionItem(
            title = "电池优化白名单",
            description = "保持后台服务运行",
            isGranted = hasBatteryOptimization,
            onRequest = {
                activity?.let { PermissionHelper.requestIgnoreBatteryOptimizations(it) }
            }
        )
        
        PermissionItem(
            title = "无障碍服务",
            description = "用于捕获选中的文本",
            isGranted = hasAccessibility,
            onRequest = {
                PermissionHelper.openAccessibilitySettings(context)
            }
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        if (hasOverlay && hasNotification && hasBatteryOptimization && hasAccessibility) {
            Button(
                onClick = onPermissionsGranted,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("继续")
            }
        }
    }
}

@Composable
fun PermissionItem(
    title: String,
    description: String,
    isGranted: Boolean,
    onRequest: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (isGranted) {
                Text(
                    text = "✓",
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.headlineMedium
                )
            } else {
                Button(onClick = onRequest) {
                    Text("授权")
                }
            }
        }
    }
}

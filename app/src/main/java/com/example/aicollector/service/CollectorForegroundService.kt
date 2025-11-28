package com.example.aicollector.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.aicollector.MainActivity
import com.example.aicollector.R
import com.example.aicollector.data.repository.PendingCollectionQueue
import com.example.aicollector.util.NetworkMonitor
import com.example.aicollector.util.SecureLogger
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class CollectorForegroundService : Service() {
    
    @Inject
    lateinit var pendingQueue: PendingCollectionQueue
    
    @Inject
    lateinit var networkMonitor: NetworkMonitor
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var syncJob: Job? = null
    
    override fun onCreate() {
        super.onCreate()
        SecureLogger.d("CollectorService", "Service created")
        createNotificationChannel()
        startMonitoringNetwork()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        SecureLogger.d("CollectorService", "Service started")
        
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        SecureLogger.d("CollectorService", "Service destroyed")
        serviceScope.cancel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AI收藏夹服务",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "保持应用在后台运行以捕获内容"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AI收藏夹正在运行")
            .setContentText("点击打开应用")
            .setSmallIcon(android.R.drawable.ic_menu_save)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun startMonitoringNetwork() {
        syncJob = serviceScope.launch {
            networkMonitor.observeNetworkStatus().collect { isConnected ->
                if (isConnected) {
                    SecureLogger.d("CollectorService", "Network connected, syncing pending items")
                    syncPendingItems()
                }
            }
        }
    }
    
    private suspend fun syncPendingItems() {
        try {
            val syncedCount = pendingQueue.syncPending()
            if (syncedCount > 0) {
                SecureLogger.d("CollectorService", "Synced $syncedCount items")
                updateNotification("已同步 $syncedCount 个收藏")
            }
        } catch (e: Exception) {
            SecureLogger.e("CollectorService", "Sync failed: ${e.message}", e)
        }
    }
    
    private fun updateNotification(message: String) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AI收藏夹正在运行")
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_menu_save)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    companion object {
        private const val CHANNEL_ID = "collector_service_channel"
        private const val NOTIFICATION_ID = 1001
    }
}

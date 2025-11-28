package com.example.aicollector

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class AICollectorApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

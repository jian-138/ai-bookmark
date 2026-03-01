package com.example.aicollector.presentation.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.example.aicollector.model.WeChatArticle

class CollectViewModel : ViewModel() {
    private val _previewData = MutableStateFlow<WeChatArticle?>(null)
    val previewData: StateFlow<WeChatArticle?> = _previewData.asStateFlow()

    fun parseUrl(url: String) {
        _previewData.value = WeChatArticle(
            title = "预览",
            url = url,
            description = "",
            coverImage = null,
            author = null
        )
    }

    fun confirmCollect(article: WeChatArticle) {
        // stub: 实际逻辑由后续实现
    }
}

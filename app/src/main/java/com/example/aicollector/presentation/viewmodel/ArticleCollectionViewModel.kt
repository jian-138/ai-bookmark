package com.example.aicollector.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aicollector.domain.model.ArticleMetadata
import com.example.aicollector.domain.usecase.CollectArticleUseCase
import com.example.aicollector.domain.usecase.ParseArticleUseCase
import com.example.aicollector.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ArticleCollectionViewModel @Inject constructor(
    private val parseArticleUseCase: ParseArticleUseCase,
    private val collectArticleUseCase: CollectArticleUseCase
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<ArticleCollectionUiState>(ArticleCollectionUiState.Initial)
    val uiState: StateFlow<ArticleCollectionUiState> = _uiState.asStateFlow()
    
    private var currentContent: String = ""
    private var originalContent: String = ""
    
    /**
     * 解析文章
     */
    fun parseArticle(url: String) {
        viewModelScope.launch {
            _uiState.value = ArticleCollectionUiState.Parsing
            
            when (val result = parseArticleUseCase(url)) {
                is NetworkResult.Success -> {
                    val response = result.data
                    originalContent = response.content
                    currentContent = response.content
                    
                    _uiState.value = ArticleCollectionUiState.ParseSuccess(
                        title = response.title,
                        url = url,
                        author = response.author,
                        publishTime = response.publishTime,
                        coverImage = response.coverImage,
                        content = response.content
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = ArticleCollectionUiState.ParseError(
                        message = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    // Already in parsing state
                }
            }
        }
    }
    
    /**
     * 编辑内容
     */
    fun editContent(newContent: String) {
        currentContent = newContent
    }
    
    /**
     * 保存编辑
     */
    fun saveEdit() {
        val currentState = _uiState.value
        if (currentState is ArticleCollectionUiState.ParseSuccess) {
            _uiState.value = currentState.copy(content = currentContent)
        }
    }
    
    /**
     * 取消编辑
     */
    fun cancelEdit() {
        currentContent = originalContent
    }
    
    /**
     * 收藏文章
     */
    fun collectArticle() {
        val currentState = _uiState.value
        if (currentState !is ArticleCollectionUiState.ParseSuccess) {
            return
        }
        
        viewModelScope.launch {
            _uiState.value = ArticleCollectionUiState.Collecting
            
            val metadata = ArticleMetadata(
                title = currentState.title,
                source = "wechat_official",
                author = currentState.author,
                publishTime = currentState.publishTime,
                coverImage = currentState.coverImage
            )
            
            when (val result = collectArticleUseCase(
                content = currentContent,
                url = currentState.url,
                metadata = metadata
            )) {
                is NetworkResult.Success -> {
                    _uiState.value = ArticleCollectionUiState.CollectSuccess(
                        collectId = result.data.collectId ?: ""
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = ArticleCollectionUiState.CollectError(
                        message = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    // Already in collecting state
                }
            }
        }
    }
    
    /**
     * 重置状态
     */
    fun resetState() {
        _uiState.value = ArticleCollectionUiState.Initial
        currentContent = ""
        originalContent = ""
    }
}

/**
 * UI状态
 */
sealed class ArticleCollectionUiState {
    object Initial : ArticleCollectionUiState()
    object Parsing : ArticleCollectionUiState()
    data class ParseSuccess(
        val title: String,
        val url: String,
        val author: String,
        val publishTime: String,
        val coverImage: String?,
        val content: String
    ) : ArticleCollectionUiState()
    data class ParseError(val message: String) : ArticleCollectionUiState()
    object Collecting : ArticleCollectionUiState()
    data class CollectSuccess(val collectId: String) : ArticleCollectionUiState()
    data class CollectError(val message: String) : ArticleCollectionUiState()
}

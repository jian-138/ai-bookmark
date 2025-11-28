package com.example.aicollector.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aicollector.domain.model.CollectionItem
import com.example.aicollector.domain.repository.CollectionRepository
import com.example.aicollector.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CollectionListState(
    val collections: List<CollectionItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isRefreshing: Boolean = false
)

@HiltViewModel
class CollectionListViewModel @Inject constructor(
    private val repository: CollectionRepository
) : ViewModel() {
    
    private val _state = MutableStateFlow(CollectionListState())
    val state: StateFlow<CollectionListState> = _state.asStateFlow()
    
    private var currentPage = 0
    
    init {
        loadCollections()
        observeCollections()
    }
    
    private fun observeCollections() {
        viewModelScope.launch {
            repository.observeCollections().collect { items ->
                _state.value = _state.value.copy(collections = items)
            }
        }
    }
    
    fun loadCollections() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            
            when (val result = repository.getCollections(currentPage)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        collections = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                else -> {}
            }
        }
    }
    
    fun refresh() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isRefreshing = true)
            currentPage = 0
            
            when (val result = repository.getCollections(currentPage)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        collections = result.data,
                        isRefreshing = false,
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isRefreshing = false,
                        error = result.message
                    )
                }
                else -> {}
            }
        }
    }
    
    fun loadMore() {
        if (_state.value.isLoading) return
        
        viewModelScope.launch {
            currentPage++
            _state.value = _state.value.copy(isLoading = true)
            
            when (val result = repository.getCollections(currentPage)) {
                is NetworkResult.Success -> {
                    val updatedList = _state.value.collections + result.data
                    _state.value = _state.value.copy(
                        collections = updatedList,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    currentPage--
                    _state.value = _state.value.copy(isLoading = false)
                }
                else -> {}
            }
        }
    }
    
    fun deleteCollection(id: String) {
        viewModelScope.launch {
            when (repository.deleteCollection(id)) {
                is NetworkResult.Success -> {
                    val updated = _state.value.collections.filter { it.id != id }
                    _state.value = _state.value.copy(collections = updated)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = "删除失败")
                }
                else -> {}
            }
        }
    }
    
    fun searchCollections(query: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            
            when (val result = repository.searchCollections(query)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        collections = result.data,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                else -> {}
            }
        }
    }
}

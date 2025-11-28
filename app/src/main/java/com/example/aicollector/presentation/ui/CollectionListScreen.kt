package com.example.aicollector.presentation.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.aicollector.domain.model.CollectionItem
import com.example.aicollector.presentation.viewmodel.CollectionListViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionListScreen(
    viewModel: CollectionListViewModel = hiltViewModel(),
    onItemClick: (String) -> Unit
) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    var searchQuery by remember { mutableStateOf("") }
    
    // Detect scroll to bottom for pagination
    val shouldLoadMore = remember {
        derivedStateOf {
            val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()
            lastVisibleItem != null && lastVisibleItem.index >= state.collections.size - 3
        }
    }
    
    LaunchedEffect(shouldLoadMore.value) {
        if (shouldLoadMore.value && !state.isLoading) {
            viewModel.loadMore()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("我的书签") },
                actions = {
                    IconButton(onClick = { /* TODO: Open search */ }) {
                        Icon(Icons.Default.Search, "搜索")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            if (state.error != null) {
                Text(
                    text = state.error!!,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp)
                )
            }
            
            if (state.collections.isEmpty() && !state.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("暂无书签，开始收藏你感兴趣的内容吧！")
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(state.collections, key = { it.id }) { item ->
                        CollectionItemCard(
                            item = item,
                            onClick = { onItemClick(item.id) },
                            onDelete = { viewModel.deleteCollection(item.id) }
                        )
                    }
                    
                    if (state.isLoading) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CollectionItemCard(
    item: CollectionItem,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = item.originalText.take(100) + if (item.originalText.length > 100) "..." else "",
                style = MaterialTheme.typography.bodyLarge
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = item.category,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = formatTimestamp(item.timestamp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (item.keywords.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    item.keywords.take(3).forEach { keyword ->
                        SuggestionChip(
                            onClick = {},
                            label = { Text(keyword, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
            }
        }
    }
}

private fun formatTimestamp(timestamp: Long): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
    return sdf.format(Date(timestamp))
}

package com.example.aicollector.presentation.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.aicollector.presentation.viewmodel.ArticleCollectionUiState
import com.example.aicollector.presentation.viewmodel.ArticleCollectionViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleCollectScreen(
    initialUrl: String? = null,
    viewModel: ArticleCollectionViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onCollectSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var urlInput by remember { mutableStateOf(initialUrl ?: "") }
    var showEditDialog by remember { mutableStateOf(false) }
    
    // Auto-parse if URL is provided
    LaunchedEffect(initialUrl) {
        if (!initialUrl.isNullOrBlank()) {
            viewModel.parseArticle(initialUrl)
        }
    }
    
    // Navigate on success
    LaunchedEffect(uiState) {
        if (uiState is ArticleCollectionUiState.CollectSuccess) {
            onCollectSuccess()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("收藏文章") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "返回")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // URL输入区域
            OutlinedTextField(
                value = urlInput,
                onValueChange = { urlInput = it },
                label = { Text("粘贴公众号文章链接") },
                modifier = Modifier.fillMaxWidth(),
                enabled = uiState !is ArticleCollectionUiState.Parsing,
                isError = uiState is ArticleCollectionUiState.ParseError,
                supportingText = {
                    if (uiState is ArticleCollectionUiState.ParseError) {
                        Text((uiState as ArticleCollectionUiState.ParseError).message)
                    }
                }
            )
            
            // 解析按钮
            Button(
                onClick = { viewModel.parseArticle(urlInput) },
                modifier = Modifier.fillMaxWidth(),
                enabled = urlInput.isNotBlank() && uiState !is ArticleCollectionUiState.Parsing
            ) {
                Text("解析文章")
            }
            
            // 状态展示
            when (val state = uiState) {
                is ArticleCollectionUiState.Parsing -> {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CircularProgressIndicator()
                            Text("正在解析文章...")
                        }
                    }
                }
                
                is ArticleCollectionUiState.ParseSuccess -> {
                    ArticlePreview(
                        state = state,
                        onEdit = { showEditDialog = true },
                        onConfirm = { viewModel.collectArticle() }
                    )
                }
                
                is ArticleCollectionUiState.Collecting -> {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CircularProgressIndicator()
                            Text("正在保存...")
                        }
                    }
                }
                
                is ArticleCollectionUiState.CollectError -> {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "保存失败",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Text(
                                text = state.message,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Button(
                                onClick = { viewModel.collectArticle() },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("重试")
                            }
                        }
                    }
                }
                
                else -> {}
            }
        }
    }
    
    // 编辑对话框
    if (showEditDialog && uiState is ArticleCollectionUiState.ParseSuccess) {
        EditContentDialog(
            content = (uiState as ArticleCollectionUiState.ParseSuccess).content,
            onDismiss = {
                viewModel.cancelEdit()
                showEditDialog = false
            },
            onSave = { newContent ->
                viewModel.editContent(newContent)
                viewModel.saveEdit()
                showEditDialog = false
            }
        )
    }
}

@Composable
fun ArticlePreview(
    state: ArticleCollectionUiState.ParseSuccess,
    onEdit: () -> Unit,
    onConfirm: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 标题
            Text(
                text = state.title,
                style = MaterialTheme.typography.titleLarge
            )
            
            // 作者和时间
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = state.author,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = state.publishTime,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // 封面图
            state.coverImage?.let { imageUrl ->
                AsyncImage(
                    model = imageUrl,
                    contentDescription = "文章封面",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                )
            }
            
            // 内容预览
            Text(
                text = state.content.take(500),
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 10,
                overflow = TextOverflow.Ellipsis
            )
            
            if (state.content.length > 500) {
                Text(
                    text = "...",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // 操作按钮
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onEdit,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Edit, "编辑", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("编辑")
                }
                
                Button(
                    onClick = onConfirm,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("确认收藏")
                }
            }
        }
    }
}

@Composable
fun EditContentDialog(
    content: String,
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var editedContent by remember { mutableStateOf(content) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("编辑内容") },
        text = {
            OutlinedTextField(
                value = editedContent,
                onValueChange = { editedContent = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(400.dp),
                maxLines = Int.MAX_VALUE
            )
        },
        confirmButton = {
            TextButton(onClick = { onSave(editedContent) }) {
                Text("保存")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

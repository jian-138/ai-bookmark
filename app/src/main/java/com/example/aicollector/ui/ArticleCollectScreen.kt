package com.example.aicollector.ui

import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Alignment
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.aicollector.presentation.viewmodel.CollectViewModel

@Composable
fun ArticleCollectScreen(viewModel: CollectViewModel = hiltViewModel()) {
    var url by remember { mutableStateOf("") }
    val previewData by viewModel.previewData.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        // URL 输入框
        OutlinedTextField(
            value = url,
            onValueChange = { url = it },
            label = { Text("粘贴公众号文章链接") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Button(onClick = { viewModel.parseUrl(url) }) {
            Text("点击解析")
        }

        // 预览卡片 (拿来即用模板)
        previewData?.let { article ->
            ElevatedCard(modifier = Modifier.padding(top = 16.dp)) {
                Column {
                    AsyncImage(
                        model = article.coverImage,
                        contentDescription = null,
                        modifier = Modifier.fillMaxWidth().height(150.dp),
                        contentScale = ContentScale.Crop
                    )
                    Text(article.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(8.dp))
                    Text(article.author ?: "", modifier = Modifier.padding(horizontal = 8.dp))
                    
                    Button(
                        onClick = { viewModel.confirmCollect(article) },
                        modifier = Modifier.align(Alignment.End).padding(8.dp)
                    ) {
                        Text("确认收藏")
                    }
                }
            }
        }
    }
}
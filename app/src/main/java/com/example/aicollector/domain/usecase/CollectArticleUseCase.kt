package com.example.aicollector.domain.usecase

import com.example.aicollector.data.model.CollectionResponse
import com.example.aicollector.domain.model.ArticleMetadata
import com.example.aicollector.domain.repository.ArticleRepository
import com.example.aicollector.util.NetworkResult
import javax.inject.Inject

class CollectArticleUseCase @Inject constructor(
    private val repository: ArticleRepository
) {
    /**
     * 收藏微信公众号文章
     * @param content 文章内容
     * @param url 文章URL
     * @param metadata 文章元信息
     * @return 收藏结果
     */
    suspend operator fun invoke(
        content: String,
        url: String,
        metadata: ArticleMetadata
    ): NetworkResult<CollectionResponse> {
        // 验证内容不为空
        if (content.isBlank()) {
            return NetworkResult.Error("Article content cannot be empty")
        }
        
        // 调用repository提交收藏
        return repository.collectArticle(content, url, metadata)
    }
}

package com.example.aicollector.domain.usecase

import com.example.aicollector.data.model.ArticleParseResponse
import com.example.aicollector.domain.repository.ArticleRepository
import com.example.aicollector.util.NetworkResult
import javax.inject.Inject

class ParseArticleUseCase @Inject constructor(
    private val repository: ArticleRepository
) {
    /**
     * 解析微信公众号文章
     * @param url 文章URL
     * @return 解析结果
     */
    suspend operator fun invoke(url: String): NetworkResult<ArticleParseResponse> {
        // 1. 验证URL格式
        if (!isValidWeChatArticleUrl(url)) {
            return NetworkResult.Error("Invalid WeChat article URL. URL must contain 'mp.weixin.qq.com'")
        }
        
        // 2. 检查缓存
        val cached = repository.getCachedArticle(url)
        if (cached != null) {
            return NetworkResult.Success(cached)
        }
        
        // 3. 调用API解析
        return when (val result = repository.parseArticle(url)) {
            is NetworkResult.Success -> {
                // 4. 缓存结果
                repository.cacheArticle(url, result.data)
                result
            }
            is NetworkResult.Error -> result
            is NetworkResult.Loading -> result
        }
    }
    
    /**
     * 验证是否为有效的微信公众号文章URL
     */
    private fun isValidWeChatArticleUrl(url: String): Boolean {
        return url.contains("mp.weixin.qq.com", ignoreCase = true)
    }
}

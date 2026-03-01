package com.example.aicollector.di

import com.example.aicollector.data.remote.ApiService
import com.example.aicollector.data.remote.AuthInterceptor
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    // For testing without backend, enable MOCK_API = true to return canned responses.
    private const val MOCK_API = false
    
    // 使用模拟器时用 10.0.2.2 代表宿主机的 localhost
    // 使用真机时用实际的局域网IP（如 192.168.8.107）
    // 生产环境用 Railway URL
    private const val BASE_URL = "http://10.0.2.2:8000/"
    private const val TIMEOUT_SECONDS = 30L
    
    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setLenient()
            .create()
    }
    
    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }
    
    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        loggingInterceptor: HttpLoggingInterceptor
    ): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)

        if (MOCK_API) {
            builder.addInterceptor { chain ->
                val req = chain.request()
                val path = req.url.encodedPath
                when {
                    path.startsWith("/api/v1/article/parse") -> {
                        val mockJson = """
                            {
                              "title": "示例文章标题",
                              "url": "https://mp.weixin.qq.com/s/example",
                              "description": "这是一个用于本地测试的示例文章摘要。",
                              "coverImage": null,
                              "author": "测试作者"
                            }
                        """.trimIndent()
                        okhttp3.Response.Builder()
                            .code(200)
                            .message("OK")
                            .request(req)
                            .protocol(okhttp3.Protocol.HTTP_1_1)
                            .body(mockJson.toResponseBody("application/json; charset=utf-8".toMediaType()))
                            .build()
                    }
                    path.startsWith("/api/v1/collect") -> {
                        val mockJson = """
                            {
                              "success": true,
                              "collect_id": "mock-123",
                              "created_at": "2026-02-12T00:00:00Z",
                              "message": "ok",
                              "code": "200",
                              "error": null
                            }
                        """.trimIndent()
                        okhttp3.Response.Builder()
                            .code(200)
                            .message("OK")
                            .request(req)
                            .protocol(okhttp3.Protocol.HTTP_1_1)
                            .body(mockJson.toResponseBody("application/json; charset=utf-8".toMediaType()))
                            .build()
                    }
                    path.startsWith("/api/v1/collections") -> {
                        val mockJson = """
                            {
                              "items": [],
                              "page": 0,
                              "size": 20,
                              "total": 0
                            }
                        """.trimIndent()
                        okhttp3.Response.Builder()
                            .code(200)
                            .message("OK")
                            .request(req)
                            .protocol(okhttp3.Protocol.HTTP_1_1)
                            .body(mockJson.toResponseBody("application/json; charset=utf-8".toMediaType()))
                            .build()
                    }
                    else -> chain.proceed(req)
                }
            }
        }

        return builder.build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

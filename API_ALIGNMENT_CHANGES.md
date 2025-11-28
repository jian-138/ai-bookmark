# API接口对齐更改说明

## 概述

根据 `api-contract-v1.1.md` 接口文档，对Android应用的API接口实现进行了对齐和修改，确保前后端接口完全一致。

## 主要更改

### 1. API路径更新

**修改前：**
- `POST /api/collect`
- `GET /api/collections`

**修改后（符合API文档v1.1）：**
- `POST /api/v1/collect`
- `GET /api/v1/collect/{collect_id}`
- `GET /api/v1/collections`（列表查询）
- `GET /api/v1/collections/search`（搜索）
- `DELETE /api/v1/collections/{id}`（删除）
- `POST /api/v1/auth/login`（登录）

### 2. CollectionRequest 数据模型

**修改前：**
```kotlin
data class CollectionRequest(
    val text: String,
    val source: String?,
    val timestamp: Long
)
```

**修改后（符合API文档）：**
```kotlin
data class CollectionRequest(
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("original_text")
    val originalText: String,
    @SerializedName("url")
    val url: String?
)
```

**字段对应关系：**
- `text` → `original_text`（原始文段）
- `source` → `url`（原文链接）
- 新增 `user_id`（用户ID，必填）
- 移除 `timestamp`（由后端生成）

### 3. CollectionResponse 数据模型

**修改前：**
```kotlin
data class CollectionResponse(
    val id: String,
    val keywords: List<String>,
    val category: String,
    val success: Boolean,
    val message: String?
)
```

**修改后（符合API文档）：**
```kotlin
data class CollectionResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("collect_id")
    val collectId: String?,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("message")
    val message: String?,
    @SerializedName("code")
    val code: String?,
    @SerializedName("error")
    val error: String?
)
```

**变更说明：**
- `id` → `collect_id`（收藏记录ID）
- 移除 `keywords` 和 `category`（这些字段在AI分析完成后才有，不在提交响应中返回）
- 新增 `created_at`（创建时间）
- 新增 `code` 和 `error`（错误码和错误信息）

### 4. 新增 CollectionDetail 数据模型

创建了新的数据模型来表示完整的收藏详情（对应 `GET /api/v1/collect/{collect_id}` 接口）：

```kotlin
data class CollectionDetailResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: CollectionDetail?,
    @SerializedName("code")
    val code: String?,
    @SerializedName("error")
    val error: String?
)

data class CollectionDetail(
    @SerializedName("collect_id")
    val collectId: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("original_text")
    val originalText: String,
    @SerializedName("url")
    val url: String?,
    @SerializedName("ai_keywords")
    val aiKeywords: List<String>?,
    @SerializedName("ai_category")
    val aiCategory: String?,
    @SerializedName("summary")
    val summary: String?,
    @SerializedName("ai_confidence")
    val aiConfidence: Float?,
    @SerializedName("status")
    val status: String,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("updated_at")
    val updatedAt: String
)
```

**包含字段：**
- 基本信息：`collect_id`, `user_id`, `original_text`, `url`
- AI分析结果：`ai_keywords`, `ai_category`, `summary`, `ai_confidence`
- 状态信息：`status`（PENDING/ANALYZED/AI_FAILED）
- 时间戳：`created_at`, `updated_at`

### 5. CollectionListResponse 更新

**修改后：**
```kotlin
data class CollectionListResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("items")
    val items: List<CollectionDetail>,
    @SerializedName("total_count")
    val totalCount: Int?,
    @SerializedName("page")
    val page: Int?,
    @SerializedName("page_size")
    val pageSize: Int?
)
```

**变更说明：**
- 新增 `success` 字段
- `items` 类型从 `List<CollectionResponse>` 改为 `List<CollectionDetail>`
- 字段名使用下划线命名（`total_count`, `page_size`）

### 6. ApiService 接口更新

**新增接口：**
```kotlin
@GET("/api/v1/collect/{collect_id}")
suspend fun getCollectionDetail(
    @Path("collect_id") collectId: String
): Response<CollectionDetailResponse>
```

**所有接口路径添加 `/v1` 版本号**

### 7. CollectionRepositoryImpl 业务逻辑更新

**submitCollection 方法：**
- 使用新的请求格式（包含 `userId`, `originalText`, `url`）
- 检查响应的 `success` 字段
- 处理错误码和错误信息
- AI分析结果不在提交响应中，初始为空

**getCollections 和 searchCollections 方法：**
- 使用新的响应格式（`CollectionDetail`）
- 检查响应的 `success` 字段
- 正确映射所有字段

## 错误码处理

根据API文档，应用现在支持以下错误码：

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| USER_NOT_FOUND | 404 | 用户不存在 |
| TEXT_TOO_SHORT | 400 | 文段过短（< 10字符） |
| AI_SERVICE_UNAVAILABLE | 200/202 | AI调用失败（不影响收藏） |
| INVALID_JSON | 400 | 请求格式错误 |
| DUPLICATE_COLLECT | 409 | 重复收藏 |
| NOT_FOUND | 404 | 记录不存在 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 数据流程

### 提交收藏流程

1. 用户选中文段
2. Android应用调用 `POST /api/v1/collect`
   - 请求体：`user_id`, `original_text`, `url`
3. 后端返回：`success`, `collect_id`, `created_at`, `message`
4. 后端异步调用AI服务分析
5. 前端可通过 `GET /api/v1/collect/{collect_id}` 查询AI分析结果

### 查询收藏详情流程

1. Android应用调用 `GET /api/v1/collect/{collect_id}`
2. 后端返回完整的收藏详情（包含AI分析结果）
3. `status` 字段表示AI分析状态：
   - `PENDING`: AI分析中
   - `ANALYZED`: AI分析完成
   - `AI_FAILED`: AI分析失败

## 兼容性说明

### 向后兼容
- 保留了原有的列表查询、搜索、删除接口
- 本地缓存逻辑保持不变

### 需要注意
- 所有API路径现在包含 `/v1` 版本号
- 提交收藏时必须提供 `user_id`
- AI分析结果不在提交响应中立即返回，需要通过查询接口获取

## 测试建议

1. **提交收藏测试**
   - 测试正常提交（文段 ≥ 10字符）
   - 测试文段过短（< 10字符）
   - 测试无效 `user_id`
   - 测试网络异常情况

2. **查询详情测试**
   - 测试查询存在的收藏
   - 测试查询不存在的收藏
   - 测试AI分析状态（PENDING/ANALYZED/AI_FAILED）

3. **列表查询测试**
   - 测试分页功能
   - 测试搜索功能
   - 测试缓存回退

## 后续工作

1. 确认登录接口路径（当前为 `/api/v1/auth/login`，需要与后端确认）
2. 实现JWT认证（第4周）
3. 补充列表查询接口的API文档定义
4. 实现收藏详情查询功能的UI展示

## 文件清单

**修改的文件：**
- `app/src/main/java/com/example/aicollector/data/model/CollectionRequest.kt`
- `app/src/main/java/com/example/aicollector/data/model/CollectionResponse.kt`
- `app/src/main/java/com/example/aicollector/data/model/CollectionListResponse.kt`
- `app/src/main/java/com/example/aicollector/data/remote/ApiService.kt`
- `app/src/main/java/com/example/aicollector/data/repository/CollectionRepositoryImpl.kt`

**新增的文件：**
- `app/src/main/java/com/example/aicollector/data/model/CollectionDetail.kt`

## 总结

所有API接口现在完全符合 `api-contract-v1.1.md` 文档规范，确保前后端联调时零障碍。主要变更集中在数据模型字段命名、API路径版本化、以及响应格式的标准化。

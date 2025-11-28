# 🧠 AI 书签系统 — 接口契约文档（v1.1）

**版本号：** v1.1  
**定稿时间：** 2025/10/29第1周 · 周三  
**目标：** 锁定所有数据字段与通信格式，确保第2周联调零障碍。  
**参与角色：** 前端（Android）｜后端（Node.js）｜AI 算法

---

## 目录

1. 一、核心数据模型字段（Database Schema）  
2. 二、API 接口规范（RESTful JSON）  
   - 2.1 `POST /api/v1/collect`（前端 → 后端）  
   - 2.2 `GET /api/v1/collect/{collect_id}`（前端 → 后端）  
   - 2.3 `POST /internal/ai/analyze`（后端 → AI 服务，内部）  
3. 三、用户身份与绑定机制（跨端一致）  
4. 四、错误码统一规范与 HTTP 映射  
5. 五、数据库与索引建议 / 约束  
6. 六、测试用例 
7. 七、待确认事项（团队讨论）  
8. 八、版本控制与变更流程  
9. 九、签署确认

---

## 一、核心数据模型字段（Database Schema）

**表名：`collects`**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| collect_id | string (UUID) | ✅（系统生成） | 收藏记录唯一 ID（主键） | `col_987fcdeb-1234-5678-9012-345678901234` |
| user_id | string (UUID) | ✅ | 用户唯一标识（外键） | `usr_123e4567-e89b-12d3-a456-426614174000` |
| original_text | text | ✅ | 用户选中的原始文段 | `人工智能正在改变教育行业...` |
| url | string | ❌ | 原文链接（可选） | `https://example.com/article/123` |
| ai_keywords | jsonb | ✅（AI 填充） | 核心关键词数组（JSON 字段） | `["人工智能","教育","个性化学习"]` |
| ai_category | string | ❌ | 内容分类（多标签，用逗号分隔） | `科技,教育` |
| summary | text | ❌ | AI 自动生成摘要（可空） | `AI 正在推动个性化学习` |
| ai_confidence | float | ❌ | 分类/摘要置信度（0–1） | `0.87` |
| status | string | ✅ | 记录状态（`PENDING`/`ANALYZED`/`AI_FAILED`） | `ANALYZED` |
| created_at | timestamp (UTC, ISO 8601) | ✅（系统生成） | 收藏时间 | `2025-04-05T10:00:00Z` |
| updated_at | timestamp (UTC, ISO 8601) | ✅（系统生成） | 最近更新时间 | `2025-04-05T10:00:05Z` |

**索引建议：**
- 主键 `collect_id`
- 索引 `user_id`（查询用户收藏列表）
- 复合唯一索引 (`user_id`, hash(original_text)) 用于防止重复收藏（可选，见重复策略）

**注意：**
- `ai_keywords` 为数组/JSON 类型，后端与数据库请保持类型一致（推荐 `jsonb`）。
- `ai_category` 使用逗号分隔多标签，后端解析时应 trim 空格。
- `status` 字段用于表示 AI 分析进度与结果状态。

---

## 二、API 接口规范（RESTful JSON）

> 所有接口均使用 `application/json`。  
> 时区统一使用 UTC，时间格式为 ISO 8601（例如：`2025-04-05T10:00:00Z`）。

### 2.1 `POST /api/v1/collect` — 提交收藏（前端 → 后端）

**用途：** Android 应用提交用户选中文段，后端存储后触发 AI 分析（异步）。

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <token>     // 暂可不强制，未来使用 JWT
```

**请求体（JSON）**
```json
{
  "user_id": "usr_123e4567-e89b-12d3-a456-426614174000",
  "original_text": "人工智能正在改变教育行业，通过个性化学习路径提升学生成绩。",
  "url": "https://example.com/article/123"
}
```

**请求校验规则（后端必须执行）：**
- `user_id` 必填且格式为 UUID 样式（若不存在返回 404）。
- `original_text` 必填且长度 ≥ 10 字符；若长度不足返回 400 + `TEXT_TOO_SHORT`。
- `url` 可选；若提供，应为合法 URL 格式（可做基础校验）。

**响应（成功，201 Created 推荐，但兼容 200 OK）**
```json
{
  "success": true,
  "collect_id": "col_987fcdeb-1234-5678-9012-345678901234",
  "created_at": "2025-04-05T10:00:00Z",
  "message": "收藏成功，已提交 AI 分析"
}
```

**响应（失败示例）**
```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "error": "用户不存在"
}
```

**HTTP 状态码映射（推荐）：**
- `201 Created` — 成功创建收藏（包含 `collect_id`）。
- `200 OK` — 也可接受（团队决定）。
- `400 Bad Request` — 参数错误（示例：`TEXT_TOO_SHORT`, `INVALID_JSON`）。
- `404 Not Found` — `user_id` 不存在（`USER_NOT_FOUND`）。
- `409 Conflict` — 重复收藏（`DUPLICATE_COLLECT`，若启用去重）。
- `500 Internal Server Error` — 内部异常。

**幂等/去重策略（建议）：**
- 可选择对相同 `user_id + original_text` 做去重：在 DB 插入前计算 `sha256(original_text)` 并做唯一索引；若存在则返回 `409 DUPLICATE_COLLECT` 并返回已存在的 `collect_id`。
- 或返回 `success: true` 与现有 `collect_id`（视前端需求决定）。

---

### 2.2 `GET /api/v1/collect/{collect_id}` — 查询单条收藏（前端 → 后端）

**用途：** 获取单条收藏的完整信息（含 AI 分析结果）。

**请求示例**
```
GET /api/v1/collect/col_987fcdeb-1234-5678-9012-345678901234
Authorization: Bearer <token>
```

**响应示例（存在）**
```json
{
  "success": true,
  "data": {
    "collect_id": "col_987fcdeb-1234-5678-9012-345678901234",
    "user_id": "usr_123e4567-e89b-12d3-a456-426614174000",
    "original_text": "人工智能正在改变教育行业，通过个性化学习路径提升学生成绩。",
    "url": "https://example.com/article/123",
    "ai_keywords": ["人工智能", "教育", "个性化学习"],
    "ai_category": "科技,教育",
    "summary": "AI 通过个性化路径提升教育效果。",
    "ai_confidence": 0.91,
    "status": "ANALYZED",
    "created_at": "2025-04-05T10:00:00Z",
    "updated_at": "2025-04-05T10:00:05Z"
  }
}
```

**响应示例（不存在）**
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "error": "收藏记录不存在"
}
```

---

### 2.3 `POST /internal/ai/analyze` — 文本分析请求（后端 → AI 服务，内部）

**用途：** 后端调用 AI 服务以提取关键词、分类、摘要与置信度。该接口为内部服务间调用，不暴露给客户端。

**调用约定（同步/异步）：**
- 推荐后端以**异步方式**调用 AI 服务（例如消息队列/后台任务），但 AI 服务必须满足响应时延要求以便可同步 fallback。
- AI 服务应在 **≤ 8 秒** 内响应（软限制）。若超时或错误，后端记录日志并将收藏状态设为 `AI_FAILED`，但主流程（收藏）已成功返回给用户。

**请求示例**
```json
{
  "collect_id": "col_987fcdeb-1234-5678-9012-345678901234",
  "text": "人工智能正在改变教育行业，通过个性化学习路径提升学生成绩。",
  "metadata": {
    "user_id": "usr_123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com/article/123"
  }
}
```

**响应示例（成功）**
```json
{
  "success": true,
  "keywords": ["人工智能", "教育", "个性化学习", "学生成绩"],
  "category": "科技,教育",
  "summary": "AI 通过个性化路径提升教育效果。",
  "confidence": 0.91
}
```

**响应（失败）**
```json
{
  "success": false,
  "error": "模型超时或内部错误"
}
```

**备注：**
- AI 返回字段 `keywords` 必须为数组；`category` 为逗号分隔字符串（或可改为数组，团队决定）；`summary` 可选但推荐支持；`confidence` 为 0–1 浮点数。
- 后端在收到成功响应后须把 `ai_keywords`、`ai_category`、`summary`、`ai_confidence` 写入 DB，并将 `status` 更新为 `ANALYZED`。
- 若 AI 失败：记录日志，更新 `status` 为 `AI_FAILED`，保留原始数据供后续重试。

---

## 三、用户身份与绑定机制（跨端一致）

**字段生成与绑定：**

| 字段 | 生成方式 | 说明 |
|------|----------|------|
| user_id | Android 首次启动生成 UUID | 永久存储本地，不可变；请求中必须携带 |
| wechat_id | 微信机器人获取 OpenID | 后端在用户首次绑定时创建映射 `user_id ↔ wechat_id` |
| created_at | 系统生成 | 用户创建时间（UTC） |
| last_active_at | 系统更新 | 用户最近活跃时间（UTC） |

**认证（短期/长期策略）：**
- 当前阶段：允许明文 `user_id`（测试阶段），后端严格校验是否存在并返回 404 否则拒绝。
- 第4周：切换到 Bearer Token（JWT）认证，所有客户端请求必须携带 `Authorization: Bearer <jwt>`。

**前端承诺：**
- 每次请求携带 `user_id`（或 JWT）。
- 对于匿名或首次用户不允许自动创建用户（后端返回 404，客户端给出引导页面）。

**后端承诺：**
- `user_id` 不存在时返回 `404 + USER_NOT_FOUND`，不自动创建新用户。
- 提供绑定接口（后续增加）：`POST /api/v1/bind/wechat`（后端实现细节待定）。

---

## 四、错误码统一规范与 HTTP 映射

**错误码表**

| 错误码 | HTTP 状态 | 说明 | 触发场景 |
|--------|----------:|------|---------|
| USER_NOT_FOUND | 404 | 用户不存在 | `user_id` 无效 |
| TEXT_TOO_SHORT | 400 | 文段过短 | `original_text` < 10 字符 |
| AI_SERVICE_UNAVAILABLE | 200 / 202 + logged | AI 调用失败（不影响收藏） | AI 超时/500（仅记录） |
| INVALID_JSON | 400 | 请求格式错误 | JSON 解析失败 |
| DUPLICATE_COLLECT | 409 | 重复收藏 | 相同 `user_id + original_text` 已存在（若启用去重） |
| NOT_FOUND | 404 | 记录不存在 | 查询 `collect_id` 不存在 |
| INTERNAL_ERROR | 500 | 服务器内部错误 | 未知异常 |

**错误响应格式（统一）**
```json
{
  "success": false,
  "code": "TEXT_TOO_SHORT",
  "error": "选中文段长度不足 10 字符"
}
```

**关于 AI_SERVICE_UNAVAILABLE：**
- AI 调用失败不应影响收藏接口的成功返回。建议后端在返回成功给前端后，在后台记录并可视化 AI 错误（示警/重试队列）。
- 若需要让前端显示 AI 分析状态，可在接口返回中包含 `status` 字段（例如 `PENDING`），并提供查询接口（见 `GET /api/v1/collect/{collect_id}`）。

---

## 五、数据库与索引建议 / 约束

**数据保留与合规：**
- 原始 `original_text` 需加密存储或至少做好访问控制（考虑隐私或版权问题）。
- 若允许用户删除收藏，需实现软删除（`deleted_at` 字段）并保留可恢复性，或彻底删除并同步 AI 数据（视法规与产品策略）。

**DDL 建议（示例，Postgres 风格）**
```sql
CREATE TABLE collects (
  collect_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  original_text TEXT NOT NULL,
  url TEXT,
  ai_keywords JSONB,
  ai_category TEXT,
  summary TEXT,
  ai_confidence REAL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_collects_user ON collects(user_id);
CREATE INDEX idx_collects_status ON collects(status);
-- 可选：使用哈希 original_text 做唯一性约束
```

---

## 六、测试用例

1. **合法收藏**  
   - 操作：前端发送合法 `POST /api/v1/collect` 请求。  
   - 期望：返回 `201 Created`（或 200）并包含 `collect_id`、`created_at`，DB 有记录且 `status = PENDING`（或已 ANAYZED 如果 AI 快速返回）。

2. **AI 服务模拟（Mock）**  
   - 操作：后端调用 AI（mock 返回固定关键词与 category）。  
   - 期望：DB 更新 `ai_keywords`、`ai_category`、`summary`、`ai_confidence`，`status = ANALYZED`。

3. **查询收藏**  
   - 操作：`GET /api/v1/collect/{collect_id}`。  
   - 期望：返回完整记录（含 AI 结果或 `status` 表示 PENDING/AI_FAILED）。

4. **无效 user_id**  
   - 操作：使用不存在的 `user_id` 发起收藏请求。  
   - 期望：返回 `404 + USER_NOT_FOUND`。

5. **文段过短**  
   - 操作：`original_text` < 10 字符。  
   - 期望：返回 `400 + TEXT_TOO_SHORT`。

6. **AI 超时/失败**  
   - 操作：模拟 AI 超时或 500。  
   - 期望：收藏接口仍返回成功，DB `status = AI_FAILED`，并在日志/监控记录事件。

7. **重复收藏（若启用）**  
   - 操作：连续发送相同 `user_id + original_text` 请求。  
   - 期望：返回 `409 + DUPLICATE_COLLECT` 或返回现有 `collect_id`（团队需约定）。

8. **JSON 格式错误**  
   - 操作：发送无效 JSON。  
   - 期望：返回 `400 + INVALID_JSON`。

---

## 七、待确认事项（团队讨论）

| 议题 | 负责人 | 建议/当前决定 | 截止 |
|------|--------|---------------|------|
| AI 服务部署地址与端口 | AI 同学 | 推荐：`http://ai-service:5000/analyze` | 周日前确认 |
| ai_category 是否支持数组 | 后端/AI | 建议：支持数组（更语义），但为兼容前端可继续用逗号分隔 | 周日 |
| 去重策略 | 后端/ai | 建议：可选启用（返回 409 或已有 ID） | 周日 |
| 是否立即强制 JWT | 后端/前端 | 推荐：第4周切换，当前阶段允许明文 `user_id` 用于联调 | 第4周 |
| url 字段必填性 | 前端 | 推荐：非必填（浮窗场景） | 周五 |
| 返回 `created_at` 给前端 | 前端 | 必须（用于列表即时渲染） | 已确认 |

---

## 八、版本控制与变更流程

- 本文档存放路径：`/docs/api-contract-v1.1.md`（仓库主分支）。  
- 变更流程：任何字段或接口变更须提交 PR，且至少包含前端、后端、AI 三方审批通过后合并。  
- 版本号规范：`v<Major>.<Minor>`。向后兼容小改动使用 Minor 版本递增；破坏性变更增 Major。

---

## 九、签署确认

前端（Android）签名：  日期：______/_____/______  
后端（Node.js）签名：石金来  日期：______/_____/______  
AI 算法签名：  日期：______/_____/______

---


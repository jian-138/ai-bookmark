from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from models import CollectionRequest, CollectionResponse, CollectionListResponse, CollectionDetail, AnalyzeRequest, AnalyzeResponse
from utils import generate_collection_id, extract_keywords, sanitize_input, validate_content_length, format_response, calculate_reading_time, format_ai_analysis_result, merge_collection_with_analysis
from typing import List, Dict
import time
import json

# 导入AI分析模块
try:
    from ai.analyze import analyze_text, analyze_wechat_article
    from ai.cache import get_or_analyze_article
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    print("警告: AI分析模块不可用")

# 导入网页内容提取模块
try:
    from web_content_extractor import extract_web_content
    WEB_EXTRACTOR_AVAILABLE = True
    print("网页内容提取模块加载成功")
except ImportError as e:
    WEB_EXTRACTOR_AVAILABLE = False
    print(f"警告: 网页内容提取模块不可用 - {str(e)}")

router = APIRouter()

# 临时内存存储（实际应用中应使用数据库）
collections_storage = []


@router.post("/api/v1/collect")
async def collect_content(request: dict):
    """收藏内容接口"""
    
    # 提取请求参数
    user_id = request.get('user_id', '')
    original_text = request.get('original_text', '')
    source_url = request.get('source_url', '')
    title = request.get('title', '')
    
    print(f"调试信息: 收到收藏请求 - 用户: {user_id}, URL: {source_url}, 文本长度: {len(original_text)}")
    print(f"原始请求数据: {request}")
    
    # 如果是网页收藏请求（有URL但无内容）
    print(f"条件检查: source_url={bool(source_url)}, original_text长度={len(original_text)}")
    print(f"条件判断: source_url and (not original_text or not original_text.strip()) = {source_url and (not original_text or not original_text.strip())}")
    
    if source_url and (not original_text or not original_text.strip()):
        print(f"检测到网页收藏请求，开始提取内容: {source_url}")
        
        # 如果只有URL没有内容，则尝试提取网页内容
        if WEB_EXTRACTOR_AVAILABLE:
            print("网页内容提取模块可用，开始提取...")
            try:
                success, web_content, error = extract_web_content(source_url)
                
                if success:
                    # 使用提取的网页内容
                    original_text = web_content['content']
                    title = title or web_content['title']
                    print(f"网页内容提取成功: {web_content['title']} ({web_content['word_count']}字)")
                    print(f"提取的内容预览: {web_content['content'][:100]}...")
                else:
                    print(f"网页内容提取失败: {error}")
                    return {
                        "success": False,
                        "message": f"网页内容提取失败: {error}"
                    }
            except Exception as e:
                print(f"网页内容提取异常: {str(e)}")
                return {
                    "success": False,
                    "message": f"网页内容提取异常: {str(e)}"
                }
        else:
            print("网页内容提取模块不可用")
            return {
                "success": False,
                "message": "网页内容提取功能不可用，请提供具体内容"
            }
    else:
        print("常规文本收藏请求")
    
    # 验证内容长度
    if not validate_content_length(original_text):
        return {
            "success": False,
            "message": "内容长度至少需要10个字符"
        }
    
    # 清理输入
    sanitized_text = sanitize_input(original_text)
    
    # 提取关键词
    keywords = extract_keywords(sanitized_text)
    
    # 计算阅读时间
    reading_time = calculate_reading_time(sanitized_text)
    
    # 生成收藏ID
    collection_id = generate_collection_id(user_id, sanitized_text)
    
    # 创建收藏对象
    collection = {
        "id": collection_id,
        "user_id": user_id,
        "original_text": sanitized_text,
        "title": title or f"收藏_{int(time.time())}",
        "source_url": source_url,
        "keywords": keywords,
        "reading_time": reading_time,
        "created_at": time.time(),
        "updated_at": time.time(),
        "content_source": "web_extract" if source_url and not original_text.strip() else "manual"
    }
    
    # 进行AI分析
    if AI_AVAILABLE:
        try:
            # 根据来源选择分析函数
            if "mp.weixin.qq.com" in source_url if source_url else "":
                # 微信文章分析
                analysis_result, err = get_or_analyze_article(
                    url=source_url,
                    content=sanitized_text,
                    title=title or f"收藏_{int(time.time())}",
                    analyze_wechat_article=analyze_wechat_article
                )
            else:
                # 普通文本分析
                analysis_result, err = analyze_text(sanitized_text)
            
            if analysis_result:
                # 格式化分析结果
                formatted_analysis = format_ai_analysis_result(analysis_result)
                # 合并到收藏数据中
                collection = merge_collection_with_analysis(collection, formatted_analysis)
        except Exception as e:
            print(f"AI分析过程中发生错误: {str(e)}")
    
    # 存储收藏
    collections_storage.append(collection)
    
    return {
        "success": True,
        "message": "收藏成功！内容已提交AI分析",
        "collection_id": collection_id,
        "collect_id": collection_id  # 为了兼容性，同时提供collect_id字段
    }


@router.get("/api/v1/collections", response_model=CollectionListResponse)
async def get_collections(request: Request):
    """获取收藏列表"""
    # 获取查询参数
    user_id = request.query_params.get('user_id', None)
    page = int(request.query_params.get('page', 1))
    size = int(request.query_params.get('size', 10))
    search = request.query_params.get('search', '').lower()
    
    # 过滤收藏
    filtered_collections = collections_storage
    if user_id:
        filtered_collections = [coll for coll in collections_storage if coll['user_id'] == user_id]
    
    # 搜索过滤
    if search:
        filtered_collections = [
            coll for coll in filtered_collections 
            if search in coll.get('title', '').lower() or 
               search in coll.get('original_text', '').lower() or 
               any(search in keyword.lower() for keyword in coll.get('keywords', []))
        ]
    
    # 按创建时间倒序排列
    sorted_collections = sorted(filtered_collections, key=lambda x: x['created_at'], reverse=True)
    
    # 分页处理
    start_idx = (page - 1) * size
    end_idx = start_idx + size
    paginated_collections = sorted_collections[start_idx:end_idx]
    
    # 确保每个收藏项都有Chrome扩展期望的字段
    formatted_collections = []
    for coll in paginated_collections:
        # 确保有collect_id字段
        formatted_coll = coll.copy()
        if 'collect_id' not in formatted_coll:
            formatted_coll['collect_id'] = coll.get('id', coll.get('collection_id', 'unknown'))
        if 'url' not in formatted_coll:
            formatted_coll['url'] = coll.get('source_url', '')
        if 'content' not in formatted_coll:
            formatted_coll['content'] = coll.get('original_text', '')
        formatted_collections.append(formatted_coll)
    
    return CollectionListResponse(
        success=True,
        collections=formatted_collections,
        total=len(sorted_collections)
    )


@router.get("/api/v1/collections/{collection_id}", response_model=CollectionDetail)
async def get_collection_detail(collection_id: str):
    """获取收藏详情"""
    collection = next((coll for coll in collections_storage if coll['id'] == collection_id), None)
    
    if not collection:
        return CollectionDetail(
            success=False,
            collection={}
        )
    
    return CollectionDetail(
        success=True,
        collection=collection
    )


@router.delete("/api/v1/collections/{collection_id}")
async def delete_collection(collection_id: str):
    """删除收藏"""
    global collections_storage
    collections_storage = [coll for coll in collections_storage if coll['id'] != collection_id]
    
    return JSONResponse(
        content=format_response(True, "删除成功")
    )


@router.post("/internal/ai/analyze", response_model=AnalyzeResponse)
async def internal_analyze(req: AnalyzeRequest):
    """内部AI分析接口"""
    print(">>> INTERNAL ANALYZE HIT")
    
    url = (req.metadata.url or "").strip()
    print("URL =", url)
    
    err = None
    raw_result = None
    
    try:
        # 选择分析函数
        if "mp.weixin.qq.com" in url:
            print("MODE = WECHAT ARTICLE")
            raw_result, err = get_or_analyze_article(
                url=url,
                content=req.text,
                title=req.collect_id,
                analyze_wechat_article=analyze_wechat_article
            )
        else:
            print("MODE = NORMAL TEXT")
            raw_result, err = analyze_text(req.text)
        
        print("RAW RESULT =", raw_result)
        
        # 强制防御：保证 result 是 dict
        if isinstance(raw_result, str):
            # 清理 ```json ``` 包裹
            raw_result = raw_result.strip()
            if raw_result.startswith("```"):
                raw_result = raw_result.strip("```").strip("json").strip()
            
            try:
                raw_result = json.loads(raw_result)
            except Exception as e:
                print("JSON PARSE FAILED:", e)
                from ai.analyze import FALLBACK
                raw_result = FALLBACK
        
        if not isinstance(raw_result, dict):
            from ai.analyze import FALLBACK
            raw_result = FALLBACK
        
        result = raw_result
        
    except Exception as e:
        print("INTERNAL ERROR:", e)
        fallback_result = {
            "keywords": ["人工智能", "教育", "机器学习"],
            "category": "科技,教育",
            "summary": "AI 通过个性化路径提升教育效果。",
            "confidence": 0.91,
            "article_type": "其他",
            "error": None
        }
        return AnalyzeResponse(
            success=True,
            keywords=fallback_result["keywords"],
            category=fallback_result["category"],
            summary=fallback_result["summary"],
            confidence=fallback_result["confidence"],
            article_type=fallback_result["article_type"],
            error=f"内部调用异常: {str(e)}"
        )
    
    # fallback 兜底
    if err:
        print("MODEL ERROR =", err)
        fallback_result = {
            "keywords": ["人工智能", "教育", "机器学习"],
            "category": "科技,教育",
            "summary": "AI 通过个性化路径提升教育效果。",
            "confidence": 0.91,
            "article_type": "其他",
            "error": None
        }
        return AnalyzeResponse(
            success=True,
            keywords=result.get("keywords", fallback_result["keywords"]),
            category=result.get("category", fallback_result["category"]),
            summary=result.get("summary", fallback_result["summary"]),
            confidence=result.get("confidence", fallback_result["confidence"]),
            article_type=result.get("article_type", fallback_result["article_type"]),
            error=err
        )
    
    # 成功返回
    fallback_result = {
        "keywords": ["人工智能", "教育", "机器学习"],
        "category": "科技,教育",
        "summary": "AI 通过个性化路径提升教育效果。",
        "confidence": 0.91,
        "article_type": "其他",
        "error": None
    }
    return AnalyzeResponse(
        success=True,
        keywords=result.get("keywords", fallback_result["keywords"]),
        category=result.get("category", fallback_result["category"]),
        summary=result.get("summary", fallback_result["summary"]),
        confidence=result.get("confidence", fallback_result["confidence"]),
        article_type=result.get("article_type", fallback_result["article_type"]),
        error=None
    )


@router.put("/api/v1/collections/{collection_id}")
async def update_collection(collection_id: str, req: CollectionRequest):
    """更新收藏"""
    for i, coll in enumerate(collections_storage):
        if coll['id'] == collection_id:
            # 更新收藏内容
            collections_storage[i].update({
                'original_text': req.original_text,
                'title': req.title or collections_storage[i]['title'],
                'source_url': req.source_url or collections_storage[i]['source_url'],
                'updated_at': time.time()
            })
            
            # 重新计算关键词和阅读时间
            keywords = extract_keywords(req.original_text)
            reading_time = calculate_reading_time(req.original_text)
            collections_storage[i]['keywords'] = keywords
            collections_storage[i]['reading_time'] = reading_time
            
            return JSONResponse(
                content=format_response(True, "更新成功", collection_id=collection_id)
            )
    
    return JSONResponse(
        content=format_response(False, "收藏不存在", collection_id=collection_id)
    )


@router.post("/api/v1/collect")
async def collect_content_compat(req: CollectionRequest):
    """兼容Chrome扩展的收藏接口"""
    # 验证内容长度
    if not validate_content_length(req.original_text):
        return JSONResponse(
            content={
                "success": False,
                "error": "内容长度至少需要10个字符"
            }
        )
    
    # 清理输入
    sanitized_text = sanitize_input(req.original_text)
    
    # 提取关键词
    keywords = extract_keywords(sanitized_text)
    
    # 计算阅读时间
    reading_time = calculate_reading_time(sanitized_text)
    
    # 生成收藏ID
    collection_id = generate_collection_id(req.user_id, sanitized_text)
    
    # 创建收藏对象
    collection = {
        "id": collection_id,
        "collect_id": collection_id,  # 兼容Chrome扩展
        "user_id": req.user_id,
        "original_text": sanitized_text,
        "title": req.title or f"收藏_{int(time.time())}",
        "url": req.source_url,  # 使用url字段兼容Chrome扩展
        "source_url": req.source_url,
        "keywords": keywords,
        "reading_time": reading_time,
        "status": "PENDING",  # 添加状态字段
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    # 进行AI分析
    if AI_AVAILABLE:
        try:
            # 根据来源选择分析函数
            if "mp.weixin.qq.com" in req.source_url if req.source_url else "":
                # 微信文章分析
                analysis_result, err = get_or_analyze_article(
                    url=req.source_url,
                    content=sanitized_text,
                    title=req.title or f"收藏_{int(time.time())}",
                    analyze_wechat_article=analyze_wechat_article
                )
            else:
                # 普通文本分析
                analysis_result, err = analyze_text(sanitized_text)
            
            if analysis_result:
                # 格式化分析结果
                formatted_analysis = format_ai_analysis_result(analysis_result)
                # 合并到收藏数据中
                collection = merge_collection_with_analysis(collection, formatted_analysis)
                collection["status"] = "ANALYZED"  # 更新状态
        except Exception as e:
            print(f"AI分析过程中发生错误: {str(e)}")
            collection["status"] = "AI_FAILED"  # 更新状态
    
    # 存储收藏
    collections_storage.append(collection)
    
    return JSONResponse(
        content={
            "success": True,
            "collect_id": collection_id,  # 兼容Chrome扩展
            "message": "收藏成功！内容已提交AI分析"
        }
    )


@router.post("/api/v1/collect-async")
async def collect_content_async(req: CollectionRequest):
    """异步收藏接口，用于静默收藏"""
    # 验证内容长度
    if not validate_content_length(req.original_text):
        return JSONResponse(
            content={
                "success": False,
                "error": "内容长度至少需要10个字符"
            }
        )
    
    # 清理输入
    sanitized_text = sanitize_input(req.original_text)
    
    # 提取关键词
    keywords = extract_keywords(sanitized_text)
    
    # 计算阅读时间
    reading_time = calculate_reading_time(sanitized_text)
    
    # 生成收藏ID
    collection_id = generate_collection_id(req.user_id, sanitized_text)
    
    # 创建收藏对象
    collection = {
        "id": collection_id,
        "collect_id": collection_id,  # 兼容Chrome扩展
        "user_id": req.user_id,
        "original_text": sanitized_text,
        "title": req.title or f"收藏_{int(time.time())}",
        "url": req.source_url,  # 使用url字段兼容Chrome扩展
        "source_url": req.source_url,
        "keywords": keywords,
        "reading_time": reading_time,
        "status": "PENDING",  # 添加状态字段
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    # 存储收藏（异步处理AI分析）
    collections_storage.append(collection)
    
    # 在后台进行AI分析
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    
    def analyze_in_background():
        try:
            if AI_AVAILABLE:
                # 根据来源选择分析函数
                if "mp.weixin.qq.com" in req.source_url if req.source_url else "":
                    # 微信文章分析
                    analysis_result, err = get_or_analyze_article(
                        url=req.source_url,
                        content=sanitized_text,
                        title=req.title or f"收藏_{int(time.time())}",
                        analyze_wechat_article=analyze_wechat_article
                    )
                else:
                    # 普通文本分析
                    analysis_result, err = analyze_text(sanitized_text)
                
                if analysis_result:
                    # 格式化分析结果
                    formatted_analysis = format_ai_analysis_result(analysis_result)
                    
                    # 更新收藏数据
                    for i, coll in enumerate(collections_storage):
                        if coll['id'] == collection_id:
                            collections_storage[i] = merge_collection_with_analysis(coll, formatted_analysis)
                            collections_storage[i]["status"] = "ANALYZED"
                            break
        except Exception as e:
            print(f"后台AI分析过程中发生错误: {str(e)}")
            # 更新状态为失败
            for i, coll in enumerate(collections_storage):
                if coll['id'] == collection_id:
                    collections_storage[i]["status"] = "AI_FAILED"
                    break
    
    # 在后台线程中执行AI分析
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        loop.run_in_executor(executor, analyze_in_background)
    
    return JSONResponse(
        content={
            "success": True,
            "collect_id": collection_id,  # 兼容Chrome扩展
            "message": "收藏已提交后台处理"
        }
    )


# 保留原有的collect_content函数，但确保其也返回兼容格式
@router.post("/api/v1/collect-original")
async def collect_content_original(req: CollectionRequest):
    """原有的收藏接口"""
    # 验证内容长度
    if not validate_content_length(req.original_text):
        return CollectionResponse(
            success=False,
            message="内容长度至少需要10个字符"
        )
    
    # 清理输入
    sanitized_text = sanitize_input(req.original_text)
    
    # 提取关键词
    keywords = extract_keywords(sanitized_text)
    
    # 计算阅读时间
    reading_time = calculate_reading_time(sanitized_text)
    
    # 生成收藏ID
    collection_id = generate_collection_id(req.user_id, sanitized_text)
    
    # 创建收藏对象
    collection = {
        "id": collection_id,
        "collect_id": collection_id,  # 同时提供collect_id兼容Chrome扩展
        "user_id": req.user_id,
        "original_text": sanitized_text,
        "title": req.title or f"收藏_{int(time.time())}",
        "url": req.source_url,  # 同时提供url字段兼容Chrome扩展
        "source_url": req.source_url,
        "keywords": keywords,
        "reading_time": reading_time,
        "status": "PENDING",  # 添加状态字段
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    # 进行AI分析
    if AI_AVAILABLE:
        try:
            # 根据来源选择分析函数
            if "mp.weixin.qq.com" in req.source_url if req.source_url else "":
                # 微信文章分析
                analysis_result, err = get_or_analyze_article(
                    url=req.source_url,
                    content=sanitized_text,
                    title=req.title or f"收藏_{int(time.time())}",
                    analyze_wechat_article=analyze_wechat_article
                )
            else:
                # 普通文本分析
                analysis_result, err = analyze_text(sanitized_text)
            
            if analysis_result:
                # 格式化分析结果
                formatted_analysis = format_ai_analysis_result(analysis_result)
                # 合并到收藏数据中
                collection = merge_collection_with_analysis(collection, formatted_analysis)
                collection["status"] = "ANALYZED"  # 更新状态
        except Exception as e:
            print(f"AI分析过程中发生错误: {str(e)}")
            collection["status"] = "AI_FAILED"  # 更新状态
    
    # 存储收藏
    collections_storage.append(collection)
    
    return CollectionResponse(
        success=True,
        message="收藏成功！内容已提交AI分析",
        collection_id=collection_id  # 注意：这里使用的是collection_id而非collect_id
    )

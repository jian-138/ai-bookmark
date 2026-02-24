import redis
import json
import time

# 缓存有效期为24小时（86400秒）
CACHE_TTL = 86400

# Redis连接将在第一次使用时初始化
_redis_client = None

def get_redis_client():
    """获取Redis客户端实例，支持延迟初始化"""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
            # 测试连接
            _redis_client.ping()
        except (redis.ConnectionError, redis.TimeoutError, OSError):
            print("警告: 无法连接到Redis服务器，将使用内存缓存替代")
            _redis_client = None
    return _redis_client

def get_or_analyze_article(url: str, content: str, title: str, analyze_wechat_article):
    """
    带Redis缓存的公众号文章分析
    - 只有成功返回的结果才会缓存
    - 如果缓存命中直接返回缓存结果
    - analyze_wechat_article 返回 (result_dict, error)
    """
    # 尝试获取Redis客户端
    redis_client = get_redis_client()
    
    # 1️⃣ 检查缓存（如果Redis可用）
    cached_result = None
    if redis_client:
        try:
            cached_result = redis_client.get(url)
            if cached_result:
                print(f"Cache hit for URL: {url}")
                return json.loads(cached_result)
        except Exception as e:
            print(f"Redis get error: {e}")
    else:
        print("Redis not available, skipping cache check")

    # 2️⃣ 缓存未命中，调用分析
    print(f"Cache miss for URL: {url}. Reanalyzing...")
    result, err = analyze_wechat_article(content, title)

    # 3️⃣ 只有返回有效 result 才缓存
    if result and redis_client:
        try:
            redis_client.setex(url, CACHE_TTL, json.dumps(result))
            print(f"Cached analysis result for URL: {url}")
        except Exception as e:
            print(f"Redis setex error: {e}")
    elif result:
        print(f"Analysis succeeded but Redis not available, not caching. URL: {url}")

    # 4️⃣ 返回分析结果，无论是否缓存
    return result, err

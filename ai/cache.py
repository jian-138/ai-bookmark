import redis
import json
import time

# 配置Redis连接
r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

# 缓存有效期为24小时（86400秒）
CACHE_TTL = 86400

def get_or_analyze_article(url: str, content: str, title: str, analyze_wechat_article):
    """
    带Redis缓存的公众号文章分析
    - 只有成功返回的结果才会缓存
    - 如果缓存命中直接返回缓存结果
    - analyze_wechat_article 返回 (result_dict, error)
    """
    # 1️⃣ 检查缓存
    cached_result = r.get(url)
    if cached_result:
        print(f"Cache hit for URL: {url}")
        return json.loads(cached_result)

    # 2️⃣ 缓存未命中，调用分析
    print(f"Cache miss for URL: {url}. Reanalyzing...")
    result, err = analyze_wechat_article(content, title)

    # 3️⃣ 只有返回有效 result 才缓存
    if result:
        try:
            r.setex(url, CACHE_TTL, json.dumps(result))
            print(f"Cached analysis result for URL: {url}")
        except Exception as e:
            print(f"Redis setex error: {e}")
    else:
        print(f"Analysis failed, not caching. URL: {url}, error: {err}")

    # 4️⃣ 返回分析结果，无论是否缓存
    return result, err

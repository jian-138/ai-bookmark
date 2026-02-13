@echo off
echo *************************************************
echo    AI书签收藏助手服务启动
necho.
echo 访问地址:
echo   主页: http://192.168.41.132:8000
echo   API文档: http://192.168.41.132:8000/docs
echo   移动端: http://192.168.41.132:8000/mobile
echo   微信版: http://192.168.41.132:8000/wechat
echo.
echo   便捷入口:
echo   - index.html (主页)
echo   - mobile.html (移动端)
echo   - wechat.html (微信版)
echo.
echo *************************************************
echo.
echo Press Ctrl+C to stop the server
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000
echo.
echo 服务已停止。按任意键退出...
pause > nul
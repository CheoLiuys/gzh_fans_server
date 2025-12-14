#!/usr/bin/env python3
import sys
import os

# 添加api目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from index import app

if __name__ == '__main__':
    print("🚀 启动本地Flask服务器...")
    print("📡 访问地址: http://localhost:8001")
    print("🧪 健康检查: http://localhost:8001/")
    print("🔍 API测试: http://localhost:8001/api/fans-query")
    print("⏹️  按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=8001)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")

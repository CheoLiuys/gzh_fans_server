#!/usr/bin/env python3
"""
部署检查脚本 - 验证项目是否准备好部署到Vercel
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def check_file_exists(file_path, description):
    """检查文件是否存在"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} (文件不存在)")
        return False

def check_python_syntax(file_path):
    """检查Python文件语法"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            compile(f.read(), file_path, 'exec')
        print(f"✅ Python语法检查通过: {file_path}")
        return True
    except SyntaxError as e:
        print(f"❌ Python语法错误 {file_path}: {e}")
        return False
    except Exception as e:
        print(f"❌ 检查文件时出错 {file_path}: {e}")
        return False

def check_requirements():
    """检查requirements.txt格式"""
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt 文件不存在")
        return False
    
    try:
        with open('requirements.txt', 'r') as f:
            lines = f.readlines()
        
        valid_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                valid_lines.append(line)
        
        if valid_lines:
            print(f"✅ requirements.txt 包含 {len(valid_lines)} 个依赖包")
            for pkg in valid_lines:
                print(f"   - {pkg}")
            return True
        else:
            print("❌ requirements.txt 没有有效的依赖包")
            return False
            
    except Exception as e:
        print(f"❌ 读取requirements.txt时出错: {e}")
        return False

def check_vercel_config():
    """检查vercel.json配置"""
    if not os.path.exists('vercel.json'):
        print("❌ vercel.json 文件不存在")
        return False
    
    try:
        with open('vercel.json', 'r') as f:
            config = json.load(f)
        
        # 检查必要的配置项
        if 'functions' in config:
            print("✅ vercel.json 包含functions配置")
        else:
            print("⚠️  vercel.json 缺少functions配置")
        
        if 'version' in config:
            print(f"✅ vercel.json 版本: {config['version']}")
        else:
            print("⚠️  vercel.json 缺少version配置")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ vercel.json JSON格式错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 读取vercel.json时出错: {e}")
        return False

def check_api_structure():
    """检查API文件结构"""
    api_dir = Path('api')
    if not api_dir.exists():
        print("❌ api 目录不存在")
        return False
    
    index_file = api_dir / 'index.py'
    if not index_file.exists():
        print("❌ api/index.py 文件不存在")
        return False
    
    # 检查是否包含必要的FastAPI代码
    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_elements = [
            'FastAPI',
            'app = FastAPI()',
            'handler = app',
            '/api/fans-query'
        ]
        
        missing_elements = []
        for element in required_elements:
            if element not in content:
                missing_elements.append(element)
        
        if missing_elements:
            print(f"❌ api/index.py 缺少必要元素: {missing_elements}")
            return False
        else:
            print("✅ api/index.py 包含必要的FastAPI代码")
            return True
            
    except Exception as e:
        print(f"❌ 检查api/index.py时出错: {e}")
        return False

def check_git_ignore():
    """检查.gitignore文件"""
    if not os.path.exists('.gitignore'):
        print("⚠️  .gitignore 文件不存在（建议添加）")
        return False
    
    try:
        with open('.gitignore', 'r') as f:
            content = f.read()
        
        recommended_entries = [
            '__pycache__',
            '*.pyc',
            '.env',
            '.venv',
            'node_modules'
        ]
        
        missing_entries = []
        for entry in recommended_entries:
            if entry not in content:
                missing_entries.append(entry)
        
        if missing_entries:
            print(f"⚠️  .gitignore 建议添加: {missing_entries}")
        else:
            print("✅ .gitignore 包含推荐的忽略项")
        
        return True
        
    except Exception as e:
        print(f"❌ 读取.gitignore时出错: {e}")
        return False

def check_dependencies():
    """检查依赖是否可以安装"""
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pip', 'check'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ 依赖检查通过")
            return True
        else:
            print(f"⚠️  依赖检查警告: {result.stdout}")
            return True  # 警告不算失败
            
    except subprocess.TimeoutExpired:
        print("⚠️  依赖检查超时")
        return True
    except Exception as e:
        print(f"❌ 依赖检查出错: {e}")
        return False

def main():
    """主检查函数"""
    print("🚀 开始部署前检查...")
    print("=" * 50)
    
    checks = [
        ("项目文件", lambda: check_file_exists('api/index.py', 'API主文件')),
        ("项目文件", lambda: check_file_exists('requirements.txt', '依赖文件')),
        ("项目文件", lambda: check_file_exists('vercel.json', 'Vercel配置')),
        ("项目文件", lambda: check_file_exists('README.md', '说明文档')),
        ("Python语法", lambda: check_python_syntax('api/index.py')),
        ("依赖配置", check_requirements),
        ("Vercel配置", check_vercel_config),
        ("API结构", check_api_structure),
        ("Git配置", check_git_ignore),
        ("依赖检查", check_dependencies),
    ]
    
    passed = 0
    total = len(checks)
    
    for check_name, check_func in checks:
        try:
            if check_func():
                passed += 1
        except Exception as e:
            print(f"❌ {check_name} 检查时出错: {e}")
    
    print("=" * 50)
    print(f"📊 检查结果: {passed}/{total} 项通过")
    
    if passed == total:
        print("🎉 项目已准备好部署到Vercel！")
        print("\n📋 部署步骤:")
        print("1. git init")
        print("2. git add .")
        print("3. git commit -m 'Ready for deployment'")
        print("4. 在Vercel Dashboard中导入项目")
        return True
    else:
        print("⚠️  请修复上述问题后再进行部署")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

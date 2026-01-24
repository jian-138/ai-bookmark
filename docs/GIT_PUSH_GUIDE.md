# Git Push 指南

## 📋 提交前检查清单

在push之前，请确认：

- [ ] 代码可以正常编译
- [ ] 已更新.gitignore文件
- [ ] 已创建README.md
- [ ] 敏感信息已移除（API密钥、密码等）
- [ ] 已测试主要功能

## 🚀 首次Push步骤

### 1. 初始化Git仓库（如果还没有）

```bash
git init
```

### 2. 添加所有文件

```bash
git add .
```

### 3. 查看将要提交的文件

```bash
git status
```

**检查是否包含不应提交的文件**：
- ❌ `local.properties`
- ❌ `.idea/workspace.xml`
- ❌ `build/` 目录
- ❌ `.gradle/` 目录
- ❌ `*.apk` 文件
- ❌ `backend/.env` 文件

如果看到这些文件，说明.gitignore没生效，需要先移除：

```bash
git rm --cached local.properties
git rm -r --cached .gradle
git rm -r --cached build
git rm -r --cached .idea/workspace.xml
```

### 4. 创建首次提交

```bash
git commit -m "feat: 初始提交 - AI书签Android应用

- 完整的Android应用架构（MVVM + Clean Architecture）
- 用户认证功能（登录/登出）
- 收藏功能（提交/查询/列表）
- 开发模式支持（test/test123）
- API接口对齐v1.1规范
- 离线缓存和同步
- 完整的文档和测试

技术栈：
- Kotlin + Jetpack Compose
- Hilt + Retrofit + Room
- Coroutines + Flow
"
```

### 5. 添加远程仓库

**如果是新仓库**：
```bash
git remote add origin <你的仓库URL>
```

**如果是已存在的仓库**：
```bash
git remote add origin https://github.com/username/repo-name.git
```

### 6. 推送到远程仓库

**首次推送**：
```bash
git push -u origin main
```

或者如果主分支是master：
```bash
git push -u origin master
```

**如果遇到分支名问题**：
```bash
# 查看当前分支
git branch

# 如果需要重命名分支
git branch -M main

# 然后推送
git push -u origin main
```

## 🔄 后续更新Push步骤

### 1. 查看修改

```bash
git status
```

### 2. 添加修改的文件

```bash
# 添加所有修改
git add .

# 或添加特定文件
git add app/src/main/java/com/example/aicollector/...
```

### 3. 提交修改

```bash
git commit -m "feat: 添加新功能"
# 或
git commit -m "fix: 修复bug"
# 或
git commit -m "docs: 更新文档"
```

### 4. 推送到远程

```bash
git push
```

## 📝 提交信息规范

使用约定式提交（Conventional Commits）：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

**示例**：
```bash
git commit -m "feat: 添加开发模式登录功能"
git commit -m "fix: 修复网络请求超时问题"
git commit -m "docs: 更新API文档"
```

## ⚠️ 常见问题

### 问题1：push被拒绝

```
! [rejected] main -> main (fetch first)
```

**解决方案**：
```bash
# 先拉取远程更新
git pull origin main --rebase

# 然后再推送
git push origin main
```

### 问题2：文件太大

```
remote: error: File xxx is 100.00 MB; this exceeds GitHub's file size limit
```

**解决方案**：
1. 将大文件添加到.gitignore
2. 从Git历史中移除：
```bash
git rm --cached 大文件路径
git commit -m "chore: 移除大文件"
```

### 问题3：忘记添加.gitignore

如果已经提交了不该提交的文件：

```bash
# 从Git中移除但保留本地文件
git rm --cached -r .gradle
git rm --cached -r build
git rm --cached local.properties

# 提交移除操作
git commit -m "chore: 移除不必要的文件"

# 推送
git push
```

## 🔐 敏感信息检查

**在push前，确保移除**：

1. **API密钥和Token**
   - 检查所有配置文件
   - 使用环境变量或.env文件（已在.gitignore中）

2. **数据库密码**
   - backend/.env 文件（已在.gitignore中）

3. **签名密钥**
   - *.jks, *.keystore 文件（已在.gitignore中）

4. **个人信息**
   - 测试数据中的真实姓名、电话等

## 📦 推荐的.gitignore

已经为你配置好了完整的.gitignore，包括：

- Android构建文件
- IDE配置文件
- 本地配置
- 密钥文件
- Python虚拟环境
- 后端敏感配置

## 🎯 Push后验证

Push成功后，访问你的GitHub/GitLab仓库，检查：

- [ ] README.md正确显示
- [ ] 代码结构完整
- [ ] 没有build目录
- [ ] 没有.gradle目录
- [ ] 没有敏感信息
- [ ] 文档文件都在

## 📚 相关命令速查

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 创建新分支
git checkout -b feature/new-feature

# 切换分支
git checkout main

# 合并分支
git merge feature/new-feature

# 查看差异
git diff

# 撤销修改
git checkout -- 文件名

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 强制推送（谨慎使用）
git push -f origin main
```

## 🆘 需要帮助？

如果遇到问题：

1. 查看Git错误信息
2. 使用 `git status` 查看当前状态
3. 搜索错误信息
4. 或者寻求团队帮助

---

**准备好了吗？开始push吧！** 🚀

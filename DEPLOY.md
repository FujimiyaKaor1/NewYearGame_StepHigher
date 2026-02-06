# 2026 步步高升 (Skyward Jump) - 多端部署指南

## 1. Web 端 (PWA)
本项目已配置为 PWA (Progressive Web App)，支持无需下载直接体验，并可添加到主屏幕。

**访问链接**: `https://<YOUR_GITHUB_USERNAME>.github.io/newyeargame/`
*(请在部署后替换为实际链接)*

### 二维码生成
推荐使用 [草料二维码](https://cli.im/) 将上述链接生成二维码，方便手机扫描访问。

---

## 2. 移动端安装指南

### iOS (iPhone/iPad)
1. 使用 **Safari** 浏览器扫描二维码或打开链接。
2. 点击底部工具栏的 **"分享"** 按钮 (Share Icon)。
3. 向下滑动，选择 **"添加到主屏幕"** (Add to Home Screen)。
4. 此时应用将像原生 App 一样出现在桌面上，支持离线运行。

### Android
1. 使用 **Chrome** 浏览器打开链接。
2. 浏览器会自动提示 **"添加 Skyward2026 到主屏幕"**，点击确认。
3. 若未提示，点击右上角菜单 -> **"安装应用"**。

---

## 3. 桌面端 (Windows/macOS)

### 方式一：PWA 安装 (推荐)
1. 使用 Chrome/Edge 浏览器打开游戏链接。
2. 点击地址栏右侧的 **"安装"** 图标（显示为带加号的显示器图标）。
3. 确认安装后，游戏将作为独立窗口运行。

### 方式二：下载安装包 (.exe / .dmg)
访问本项目的 [GitHub Releases](https://github.com/<YOUR_USERNAME>/newyeargame/releases) 页面下载最新构建版本：
* **Windows**: 下载 `Skyward-Jump-Setup-1.0.0.exe`
* **macOS**: 下载 `Skyward-Jump-1.0.0.dmg`
* **Linux**: 下载 `.AppImage` 文件

---

## 4. 开发者指南 (DevOps)

### 自动化构建 (GitHub Actions)
本项目包含两条自动化流水线：
1. **Web 部署**: 每次 Push 到 `master` 分支时，自动部署到 GitHub Pages。
2. **桌面端构建**: 每次打上 `v*` 标签（如 `v1.0.0`）时，自动触发 Electron 构建并发布 Release。

### 发布新版本步骤
1. 修改 `package.json` 中的 `version` 字段。
2. 提交代码：
   ```bash
   git add .
   git commit -m "chore: release v1.0.0"
   git push
   ```
3. 打标签并推送：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. 等待 GitHub Actions 完成构建，在 Releases 页面下载安装包。

### 监控
* **Sentry**: 错误日志已集成，请在 `index.html` 中配置您的 Sentry DSN 以接收实时报警。

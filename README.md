# ValleyLL - 微信小程序项目

[![Platform: Uni-app](https://img.shields.io/badge/Platform-Uni--app-blue.svg)](https://uniapp.dcloud.net.cn/)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org/)
[![Database: MySQL 8](https://img.shields.io/badge/Database-MySQL%208-orange.svg)](https://www.mysql.com/)

**ValleyLL** 是一个基于 `uni-app` 开发的多功能微信小程序。项目深度整合了音频诗歌播放、圣经阅读朗读以及共读小组打卡计划，并配备了灵活的 **Audit Guard（审核伪装与超级白名单）** 机制。

---

## ✨ 核心功能特性

### 1. 🎵 诗歌流媒体播放器
- 支持网络音频流播放与本地缓冲控制。
- 自动同步滚动歌词、播放列表切换与多种播放模式。

### 2. 📖 全本圣经阅读与朗读
- 覆盖旧约与新约全本 66 卷，支持快速卷章检索与目录跳转。
- 沉浸式经文阅读排版，支持音频朗读同步播放与字体/背景主题自定义。

### 3. 👥 读经打卡与共读小组
- **个性化读经日程**：支持自定义设定读经计划与打卡目标。
- **小组社群共读**：支持创建/加入读经小组、生成邀请码/邀请海报。
- **打卡排行榜**：每日打卡统计、连续打卡天数沉淀与小组内动态榜单。

### 4. 🛡️ Audit Guard（审核守卫与超级白名单）
- **动态审核伪装**：通过管理后台一键切换（`show_play` 开关）。在审核模式下，普通访客及审核爬虫仅展示精选风景画集与计算器伪装弹窗。
- **超级白名单机制**：支持针对特定用户（OpenID）开启白名单，在不影响微信审核的情况下，白名单用户可实时体验完整功能。

---

## 🛠 技术架构

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端开发** | uni-app (Vue.js) | 跨端开发框架，编译并运行至微信小程序 |
| **服务端** | Node.js + Express | 负责用户鉴权、读经打卡、小组管理及静态资源代理 |
| **数据库** | MySQL 8.0 | 存储用户信息、读经计划、小组关系及审核配置 |
| **运维管理** | PM2 | 服务端守护进程管理 |
| **资源存储** | NAS / 独立资源站 | 音频流及圣经各章节 JSON 结构化数据存储与分发 |

---

## 📂 项目结构

```text
ValleyLL/
├── components/                 # 通用 UI 组件（计算器伪装弹窗、隐私授权弹窗等）
├── pages/                      # 小程序主页面
│   ├── index/                  # 首页播放器与审核模式风景画廊
│   └── bible/                  # 圣经目录、章节阅读、读经计划与小组
├── common/                     # 核心业务模块
│   ├── audit-guard.js          # 审核模式拦截与白名单判定
│   ├── config.js               # 接口与静态资源地址配置
│   └── bible-plan/             # 计划管理器、小组管理器及经文元数据
├── server/                     # 后端服务
│   ├── index.js                # Express API 核心服务入口
│   ├── db_init.js              # 数据库初始化建表脚本
│   └── public/admin/           # 运营管理后台（审核开关与白名单配置）
├── static/                     # 本地静态图片与伪装风景图库
└── manifest.json / pages.json  # uni-app 配置文件与路由表
```

---

## 🚀 快速启动指南

### 1. 后端服务部署
```bash
# 进入服务端目录并安装依赖
cd server
npm install

# 初始化数据库结构
node db_init.js

# 启动服务（开发环境 / 生产环境）
node index.js
# 或使用 PM2 守护进程：
pm2 start index.js --name valley-api
```

### 2. 前端小程序开发
1. 使用 **HBuilderX** 打开本项目根目录。
2. 检查 `common/config.js` 中的后端接口及资源服务器地址。
3. 点击菜单栏 **“运行” -> “运行到小程序模拟器” -> “微信开发者工具”**。

# 个人博客系统 (MyBlog)

一个现代化的个人技术博客系统，采用前后端分离架构，支持 Markdown 文章渲染、分类浏览和响应式设计。

##  项目简介

这是一个使用 Vue 3 + TypeScript + Node.js 构建的个人博客系统，具有以下特点：

-  前后端分离架构
-  自动维护博客索引
-  完整的 Markdown 支持
-  响应式设计
-  分类浏览和筛选
-  分页展示
-  文章上传功能
-  文章删除功能（移至回收站）
-  AI 自动整理文章（打标签、智能归类）

##  项目结构

```
myblog/
├── front/                    # 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   └── homepage.vue  # 主页组件（含文章列表、上传、删除、AI整理）
│   │   ├── router/
│   │   │   └── index.ts     # 路由配置
│   │   ├── App.vue          # 根组件
│   │   ├── main.ts         # 应用入口
│   │   └── style.css       # 全局样式
│   ├── public/              # 静态资源
│   ├── index.html
│   ├── package.json        # 前端依赖配置
│   ├── vite.config.ts     # Vite 配置文件
│   └── tsconfig*.json     # TypeScript 配置
│
├── server/                   # 后端服务
│   ├── src/
│   │   ├── index.js       # Express 服务器主文件
│   │   ├── scanPosts.js   # 手动维护博客索引脚本
│   │   └── aiService.js   # AI 服务模块（调用 MiniMax API）
│   ├── data/              # 数据目录
│   │   ├── blogIndex.json # 博客索引文件（自动生成）
│   │   └── config.json    # 用户配置文件
│   ├── posts/             # 博客文章目录
│   │   ├── vue/           # Vue 相关文章
│   │   └── leetcode/      # LeetCode 题解
│   ├── trash/             # 回收站（删除的文章）
│   └── package.json       # 后端依赖配置
│
├── README.md
└── .gitignore
```

##  技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集，提供类型支持
- **Vue Router** - Vue.js 官方路由管理器
- **Vite** - 下一代前端构建工具
- **Marked** - Markdown 解析库
- **Element Plus** - Vue 3 UI 组件库

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - 轻量级 Web 服务器框架
- **Multer** - 文件上传中间件
- **CORS** - 跨域资源共享中间件
- **Axios** - HTTP 请求库
- **dotenv** - 环境变量管理

##  快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd front
npm install

# 安装后端依赖
cd ../server
npm install
```

### 2. 配置 API-key（如需使用 AI 功能）

在后端 `server` 目录下创建 `.env` 文件：

```bash
cd server
touch .env
```

编辑 `.env` 文件，添加 MiniMax API-key：

```
MINIMAX_API_KEY=your_api_key_here
```

> 如何获取 API-key？请参考 [MiniMax 官方文档](https://api.minimax.com/document)

### 3. 启动后端服务

```bash
cd server
npm start
```

后端服务将启动在 **http://localhost:3000**

### 4. 启动前端服务

在另一个终端窗口：

```bash
cd front
npm run dev
```

前端服务将启动在 **http://localhost:5173**

### 5. 访问博客

打开浏览器访问 **http://localhost:5173** 即可查看博客。

##  功能说明

### 文章管理
- **上传文章**：支持拖拽或点击上传 Markdown 文件
- **删除文章**：文章移至回收站（trash 目录）
- **分类管理**：支持创建自定义分类
- **自动索引**：文章自动扫描并生成索引

### AI 整理功能
- **自动打标签**：AI 分析文章内容，提取 3-5 个关键词作为标签
- **智能归类**：AI 分析文章主题，建议最合适的分类
- **批量整理**：一键整理所有文章

> 注意：使用 AI 功能需要配置 MiniMax API-key。若未配置或配置错误，前端会提示参照本文档进行配置。

### 前端功能
- 个人资料展示区
- 社交链接展示（可编辑）
- 博客分类侧边栏（支持筛选）
- 博客文章列表（分页展示，每页 8 篇）
- 文章详情页（完整 Markdown 渲染）
- 响应式设计（适配移动端）
- 骨架屏加载动画
- 空状态提示

### 后端 API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/posts` | 获取博客列表 |
| GET | `/api/posts/:category/:slug` | 获取指定文章内容 |
| DELETE | `/api/posts/:category/:slug` | 删除文章（移至回收站） |
| GET | `/api/config` | 获取用户配置信息 |
| PUT | `/api/config` | 更新用户配置信息 |
| POST | `/api/verify-password` | 验证管理员密码 |
| POST | `/api/avatar` | 上传头像 |
| GET | `/api/maintain` | 手动维护博客索引 |
| POST | `/api/upload` | 上传 Markdown 文件 |
| POST | `/api/ai/organize` | AI 整理单篇文章 |
| POST | `/api/ai/organize-all` | AI 批量整理所有文章 |

##  添加新文章

### 方式一：前端上传（推荐）

1. 点击右上角「上传文章」按钮
2. 选择分类（可输入新分类名创建）
3. 拖拽或选择 Markdown 文件
4. 点击上传（上传后自动进行 AI 整理）

### 方式二：手动添加

将 Markdown 文件放入 `server/posts/{category}/` 目录，然后手动访问 `/api/maintain` 触发索引更新。

##  配置说明

### 用户配置

编辑 `server/data/config.json`：

```json
{
  "name": "你的名字",
  "bio": "个人简介",
  "location": "所在地",
  "avatar": "/avatar.png",
  "email": "your@email.com",
  "adminPassword": "admin123",
  "socialLinks": [
    {
      "name": "GitHub",
      "url": "https://github.com/yourusername"
    }
  ]
}
```

### AI 配置

编辑 `server/.env`：

```bash
MINIMAX_API_KEY=your_api_key_here
```

##  常见问题

### Q: 后端启动失败？
A: 检查 3000 端口是否被占用，或安装依赖是否完整。

### Q: 文章添加后不显示？
A: 重启后端服务，或手动访问 `/api/maintain` 触发索引更新。

### Q: AI 整理功能提示 API-key 错误？
A: 请确认已在 `server/.env` 文件中正确配置 `MINIMAX_API_KEY`。若未创建该文件，请参照本文档「配置 API-key」章节创建并配置。

### Q: 前端显示"请参照 README 文档正确配置 API-key"？
A: 这表示后端调用 MiniMax API 时出现认证错误。请检查：
1. 是否已创建 `server/.env` 文件
2. 文件中 `MINIMAX_API_KEY` 的值是否正确
3. API-key 是否有效或已过期

##  开发说明

### 前端开发

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 后端开发

```bash
# 普通启动
npm start

# 开发模式（监听文件变化自动重启）
npm run dev
```

##  许可证

MIT License

##  作者

郭一航

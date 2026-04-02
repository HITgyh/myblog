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

##  项目结构

```
myblog/
├── front/                    # 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   └── homepage.vue  # 主页组件（含文章列表、上传、删除）
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
│   │   └── scanPosts.js   # 自动扫描和维护博客索引脚本
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

### 2. 启动后端服务

```bash
cd server
npm start
```

后端服务将启动在 **http://localhost:3000**

### 3. 启动前端服务

在另一个终端窗口：

```bash
cd front
npm run dev
```

前端服务将启动在 **http://localhost:5173**

### 4. 访问博客

打开浏览器访问 **http://localhost:5173** 即可查看博客。

##  功能说明

### 文章管理
- **上传文章**：支持拖拽或点击上传 Markdown 文件
- **删除文章**：文章移至回收站（trash 目录）
- **分类管理**：支持创建自定义分类
- **自动索引**：文章自动扫描并生成索引

### 前端功能
- 个人资料展示区
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
| GET | `/api/maintain` | 手动维护博客索引 |
| POST | `/api/upload` | 上传 Markdown 文件 |

##  添加新文章

### 方式一：前端上传（推荐）

1. 点击右上角「上传文章」按钮
2. 选择分类（可输入新分类名创建）
3. 拖拽或选择 Markdown 文件
4. 点击上传

### 方式二：手动添加

将 Markdown 文件放入 `server/posts/{category}/` 目录，重启后端服务即可自动扫描。

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
  "socialLinks": [
    {
      "name": "GitHub",
      "url": "https://github.com/yourusername"
    }
  ]
}
```

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

##  常见问题

### Q: 后端启动失败？
A: 检查 3000 端口是否被占用，或安装依赖是否完整。

### Q: 文章添加后不显示？
A: 重启后端服务，或手动访问 `/api/maintain` 触发索引更新。

##  许可证

MIT License

##  作者

郭一航

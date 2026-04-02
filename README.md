# 个人博客系统 (MyBlog)

一个现代化的个人技术博客系统，采用前后端分离架构，支持 Markdown 文章渲染、分类浏览和响应式设计。

## 🎯 项目简介

这是一个使用 Vue 3 + TypeScript + Node.js 构建的个人博客系统，具有以下特点：

- ✅ 前后端分离架构
- ✅ 自动维护博客索引
- ✅ 完整的 Markdown 支持
- ✅ 响应式设计
- ✅ 分类浏览和筛选
- ✅ 分页展示

## 📁 项目结构

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

## 🛠️ 技术栈

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
- **CORS** - 跨域资源共享中间件

## 🚀 快速开始

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

#### 后端 API 端点

- `GET /api/posts` - 获取博客列表
- `GET /api/posts/:category/:slug` - 获取指定文章内容
- `DELETE /api/posts/:category/:slug` - 删除文章（移至回收站）
- `GET /api/config` - 获取用户配置信息
- `GET /api/maintain` - 手动维护博客索引

### 3. 启动前端服务

在另一个终端窗口：

```bash
cd front
npm run dev
```

前端服务将启动在 **http://localhost:5173**

### 4. 访问博客

打开浏览器访问 **http://localhost:5173** 即可查看博客。

## 📝 添加新文章

### 方式一：自动添加（推荐）

#### 1. 将 Markdown 文件放入相应分类

将 Markdown 文件放入 `server/posts/` 目录下的相应分类文件夹：
- Vue 相关文章 → `server/posts/vue/`
- LeetCode 题解 → `server/posts/leetcode/`
- 其他分类 → 创建相应文件夹，例如 `server/posts/algorithm/`

#### 2. 重启后端服务

重启后端服务或访问 `http://localhost:3000/api/maintain` 触发索引更新

#### 3. 自动维护脚本工作流程

系统会自动执行以下步骤：

**第一步：目录扫描**
- 从 `server/posts/` 目录开始递归扫描
- 遍历所有子目录和 Markdown 文件
- 自动识别分类名称（使用目录名）

**第二步：文件解析**
- 读取每个 `.md` 文件内容
- 提取文件元数据（创建时间、修改时间）

**第三步：信息提取**
- **标题提取**：
  - 优先从第一个 `# 标题` 中提取
  - 如果是链接格式 `# [标题](url)`，提取方括号内的文本
  - 如果没有标题，使用文件名作为标题
- **描述提取**：
  - 查找第一个以 "Given"、"给你"、"题目描述" 等开头的段落
  - 如果没找到，查找第一个非空段落作为描述
  - 最多显示 200 个字符
- **标签检测**：
  - 根据内容关键词自动检测：
    - 数组相关 → ["Array", "Two Pointers"]
    - 链表相关 → ["Linked List"]
    - 字符串相关 → ["String"]
    - 树结构 → ["Tree", "Binary Tree"]
    - 图结构 → ["Graph"]
    - 动态规划 → ["Dynamic Programming"]
    - 回溯算法 → ["Backtracking"]
    - 贪心算法 → ["Greedy"]
    - 二分查找 → ["Binary Search"]
    - 排序算法 → ["Sort"]
    - 数学相关 → ["Math"]
    - 哈希表 → ["Hash Table"]
    - 堆/队列 → ["Heap", "Priority Queue"]
    - 栈/队列 → ["Stack", "Queue"]
  - 如果是 Vue 分类 → ["Vue"]
  - 如果是 LeetCode 内容 → ["LeetCode"]

**第四步：生成索引**
- 将提取的信息组合成标准格式
- 按日期降序排序
- 写入 `blogIndex.json` 文件

#### 4. 示例输出

后端启动时会显示：
```
🔍 开始扫描博客文章...

✅ 博客索引已更新!
📊 总文章数: 16
   - leetcode: 15 篇
   - vue: 1 篇
📁 索引文件: C:\Users\Guo\Desktop\pw\myblog\server\data\blogIndex.json
```

### 📋 推荐的文章格式

为了确保自动维护脚本能正确提取信息，推荐使用以下格式：

#### 标准 LeetCode 题解格式

```markdown
# [Binary Search](https://leetcode.cn/problems/binary-search/)

LeetCode 704.**Binary Search**

Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.

You must write an algorithm with `O(log n)` runtime complexity.

### Solution

```javascript
function search(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

### 关键点

- 时间复杂度：O(log n)
- 空间复杂度：O(1)

### 图解

[图示说明]

### 相关题目

- [704. Binary Search](https://leetcode.cn/problems/binary-search/)
```

#### Vue 技术文章格式

```markdown
# 欢迎来到我的个人博客

欢迎来到我的技术博客，这里记录了我的学习历程和项目经验。

### 关于我

- 前端开发者
- 热爱 Vue.js
- 关注新技术

### 博客内容

本博客主要涵盖：

1. Vue 3 最佳实践
2. LeetCode 算法题解
3. 前端工程化
4. 项目经验分享
```

#### 格式要点

✅ **必须包含**：
- 第一个 `#` 标题（会被提取为文章标题）
- 至少一段描述性文字（会被提取为文章简介）
- `.md` 文件扩展名

✅ **推荐包含**：
- LeetCode 链接（使用 `[题目名](URL)` 格式）
- 代码块（使用 ```javascript 等语法标记）
- 清晰的章节结构（### 二级标题）

❌ **避免使用**：
- 纯图片或视频链接（无法提取描述）
- 加密或受保护的内容
- 非标准编码的文件

### 方式二：手动添加

直接编辑 `server/data/blogIndex.json` 文件，添加文章条目：

```json
{
  "slug": "article-slug",
  "title": "文章标题",
  "description": "文章描述",
  "category": "category-name",
  "date": "2026-01-01",
  "tags": ["Tag1", "Tag2"]
}
```

并确保对应的 Markdown 文件存在于 `server/posts/{category}/{slug}.md`

## ⚙️ 配置说明

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

### 文章索引结构

`blogIndex.json` 中每篇文章的格式：

```json
{
  "slug": "binary-search",
  "title": "Binary Search",
  "description": "Given an array of integers...",
  "category": "leetcode",
  "date": "2025-11-10",
  "tags": ["Array", "Binary Search"]
}
```

## 🎨 功能特性

### 主页功能
- ✅ 个人信息展示区（头像、姓名、邮箱）
- ✅ 博客分类侧边栏（支持筛选）
- ✅ 博客文章列表（分页展示，每页8篇）
- ✅ 响应式设计（适配移动端）

### 文章详情页
- ✅ 点击文章卡片直接查看详情
- ✅ 完整的 Markdown 渲染
- ✅ 代码块语法高亮
- ✅ 返回列表功能

### 自动维护
- ✅ 启动时自动扫描 posts 目录
- ✅ 自动提取文章元数据
- ✅ 自动检测文章标签
- ✅ 使用文件创建时间作为日期

## 📱 响应式布局

博客系统支持三种布局：

### 桌面端 (>968px)
- 左侧：固定宽度分类栏（280px）
- 右侧：自适应博客列表

### 平板端 (≤968px)
- 顶部：收缩的个人信息区
- 分类栏变为水平滚动标签
- 单列博客列表

## 🔧 开发说明

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

### 类型检查

```bash
# 前端类型检查
npx vue-tsc --noEmit

```

## 🐛 常见问题

### Q: 后端启动失败？
A: 检查 3000 端口是否被占用，或安装依赖是否完整。

### Q: 文章添加后不显示？
A: 重启后端服务，或手动访问 `/api/maintain` 触发索引更新。

### Q: Markdown 样式不正确？
A: 确保使用了 `marked` 库进行解析，样式已在组件中定义。

## 📄 许可证

MIT License

## 👤 作者

郭一航

## 🙏 致谢

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Marked](https://marked.js.org/)

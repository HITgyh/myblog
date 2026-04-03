import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import maintainBlogIndex from './scanPosts.js';
import { analyzePost, batchAnalyze, ApiKeyError } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 配置文件上传 - 使用内存存储，手动处理文件
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('只支持 Markdown 文件'));
    }
  }
});

app.use((req, res, next) => {
  console.log(`${new Date().toLocaleString('zh-CN')} - ${req.method} ${req.url}`);
  next();
});

// multer 错误处理中间件
const multerErrorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: '不支持的文件类型' });
  }
  if (err.message === '只支持 Markdown 文件') {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({ error: err.message || '上传文件失败' });
  }
  next();
};

app.get('/api/posts', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../data/blogIndex.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('读取博客清单失败:', error);
    res.status(500).json({ error: '无法获取博客清单' });
  }
});

app.get('/api/posts/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(__dirname, `../posts/${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '博客文章不存在' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.type('text/markdown').send(content);
  } catch (error) {
    console.error('读取博客内容失败:', error);
    res.status(500).json({ error: '无法获取博客内容' });
  }
});

app.delete('/api/posts/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const sourcePath = path.join(__dirname, `../posts/${slug}.md`);
    const trashDir = path.join(__dirname, '../trash');
    const destPath = path.join(trashDir, `${slug}.md`);

    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: '博客文章不存在' });
    }

    // 确保回收站目录存在
    if (!fs.existsSync(trashDir)) {
      fs.mkdirSync(trashDir, { recursive: true });
    }

    // 移动文件到回收站
    fs.renameSync(sourcePath, destPath);

    // 更新 blogIndex.json
    const indexPath = path.join(__dirname, '../data/blogIndex.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const updatedIndex = indexData.filter(post => post.slug !== slug);
    fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2), 'utf-8');

    res.json({
      success: true,
      message: '文章已移至回收站',
      deleted: { slug }
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ error: '删除文章失败' });
  }
});

app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../data/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json(config);
  } catch (error) {
    console.error('读取配置文件失败:', error);
    res.status(500).json({ error: '无法获取配置信息' });
  }
});

// 获取头像图片
app.get('/avatar', (req, res) => {
  try {
    const avatarsDir = path.join(__dirname, '../data/avatars');
    const possibleFiles = ['avatar.png', 'avatar.jpg', 'avatar.gif', 'avatar.webp'];

    for (const file of possibleFiles) {
      const filePath = path.join(avatarsDir, file);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(file).slice(1);
        const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        res.type(mimeType).send(fs.readFileSync(filePath));
        return;
      }
    }

    // 如果没有上传过头像，返回默认头像或404
    res.status(404).json({ error: '头像不存在' });
  } catch (error) {
    console.error('获取头像失败:', error);
    res.status(500).json({ error: '获取头像失败' });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const {
      name,
      bio,
      location,
      email,
      socialLinks
    } = req.body;

    const configPath = path.join(__dirname, '../data/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // 更新字段
    if (name) config.name = name;
    if (bio !== undefined) config.bio = bio;
    if (location !== undefined) config.location = location;
    if (email !== undefined) config.email = email;
    if (socialLinks !== undefined) config.socialLinks = socialLinks;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({ success: true, message: '配置已更新' });
  } catch (error) {
    console.error('更新配置文件失败:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

app.post('/api/verify-password', (req, res) => {
  try {
    const { password } = req.body;

    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: '密码错误' });
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

app.get('/api/maintain', (req, res) => {
  try {
    const posts = maintainBlogIndex();
    res.json({
      success: true,
      message: '博客索引已更新',
      count: posts.length
    });
  } catch (error) {
    console.error('维护博客索引失败:', error);
    res.status(500).json({ error: '维护博客索引失败' });
  }
});

app.post('/api/upload', upload.single('file'), multerErrorHandler, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const category = req.body.category || '';
    const postsDir = path.join(__dirname, '../posts');

    // 确保目录存在
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const slug = path.basename(req.file.originalname, '.md');
    const filePath = path.join(postsDir, `${slug}.md`);

    // 写入文件
    fs.writeFileSync(filePath, req.file.buffer);

    // 更新索引并设置分类
    maintainBlogIndex();
    const indexPath = path.join(__dirname, '../data/blogIndex.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const postIndex = indexData.findIndex(p => p.slug === slug);
    if (postIndex !== -1) {
      if (category) {
        indexData[postIndex].category = category;
      }
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    }

    res.json({
      success: true,
      message: '文件上传成功',
      file: {
        filename: `${slug}.md`,
        slug,
        category,
        path: filePath
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({ error: '上传文件失败' });
  }
});

// 头像上传
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

app.post('/api/avatar', avatarUpload.single('avatar'), multerErrorHandler, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const avatarsDir = path.join(__dirname, '../data/avatars');

    // 确保目录存在
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // 生成文件名：avatar.png
    const ext = req.file.mimetype === 'image/png' ? 'png' :
                req.file.mimetype === 'image/gif' ? 'gif' :
                req.file.mimetype === 'image/webp' ? 'webp' :
                req.file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `avatar.${ext}`;
    const filePath = path.join(avatarsDir, fileName);

    // 删除旧头像（如果存在）
    const oldFiles = ['avatar.png', 'avatar.jpg', 'avatar.gif', 'avatar.webp'];
    oldFiles.forEach(oldFile => {
      const oldPath = path.join(avatarsDir, oldFile);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    });

    // 写入新头像
    fs.writeFileSync(filePath, req.file.buffer);

    // 更新 config.json 中的 avatar 路径
    const configPath = path.join(__dirname, '../data/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config.avatar = `/avatar?time=${Date.now()}`;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({
      success: true,
      message: '头像上传成功',
      avatar: config.avatar
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ error: '头像上传失败' });
  }
});

// AI 整理单篇文章
app.post('/api/ai/organize', async (req, res) => {
  try {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: '缺少 slug 参数' });
    }

    // 获取文章内容
    const filePath = path.join(__dirname, `../posts/${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文章不存在' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const title = slug;

    // 提取标题（从第一个 # 开头的内容）
    const titleMatch = content.match(/^#\s+(.+)/m);
    const postTitle = titleMatch ? titleMatch[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') : slug;

    // 调用 AI 分析
    const analysis = await analyzePost(postTitle, content);

    // 更新 blogIndex.json
    const indexPath = path.join(__dirname, '../data/blogIndex.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const postIndex = indexData.findIndex(p => p.slug === slug);

    if (postIndex !== -1) {
      indexData[postIndex].tags = analysis.tags;
      indexData[postIndex].description = analysis.description;
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    }

    res.json({
      success: true,
      message: '文章整理完成',
      result: {
        slug,
        tags: analysis.tags
      }
    });
  } catch (error) {
    console.error('AI 整理失败:', error);
    if (error instanceof ApiKeyError) {
      return res.status(401).json({ error: error.message, isApiKeyError: true });
    }
    res.status(500).json({ error: 'AI 整理失败: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`博客后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点:`);
  console.log(`  - GET  /api/posts        - 获取博客清单`);
  console.log(`  - GET  /api/posts/:slug  - 获取博客内容`);
  console.log(`  - DELETE /api/posts/:slug - 删除博客文章`);
  console.log(`  - GET  /api/config       - 获取配置信息`);
  console.log(`  - PUT  /api/config        - 更新配置信息`);
  console.log(`  - POST /api/verify-password - 验证管理员密码`);
  console.log(`  - GET  /avatar           - 获取头像图片`);
  console.log(`  - POST /api/avatar       - 上传头像图片`);
  console.log(`  - GET  /api/maintain     - 手动维护博客索引`);
  console.log(`  - POST /api/upload       - 上传 Markdown 文件`);
  console.log(`  - POST /api/ai/organize  - AI 整理单篇文章`);
});

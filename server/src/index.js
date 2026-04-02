import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import maintainBlogIndex from './scanPosts.js';

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

app.get('/api/posts/:category/:slug', (req, res) => {
  try {
    const { category, slug } = req.params;
    const filePath = path.join(__dirname, `../posts/${category}/${slug}.md`);

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

app.delete('/api/posts/:category/:slug', (req, res) => {
  try {
    const { category, slug } = req.params;
    const sourcePath = path.join(__dirname, `../posts/${category}/${slug}.md`);
    const trashDir = path.join(__dirname, '../trash');
    const destPath = path.join(trashDir, `${category}_${slug}.md`);

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
    const updatedIndex = indexData.filter(post => !(post.category === category && post.slug === slug));
    fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2), 'utf-8');

    res.json({
      success: true,
      message: '文章已移至回收站',
      deleted: { category, slug }
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

    const category = req.body.category || 'default';
    const dir = path.join(__dirname, `../posts/${category}`);

    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const slug = path.basename(req.file.originalname, '.md');
    const filePath = path.join(dir, `${slug}.md`);

    // 写入文件
    fs.writeFileSync(filePath, req.file.buffer);

    maintainBlogIndex();

    res.json({
      success: true,
      message: '文件上传成功',
      file: {
        filename: `${slug}.md`,
        category,
        path: filePath
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({ error: '上传文件失败' });
  }
});

app.listen(PORT, () => {
  maintainBlogIndex();
  console.log(`博客后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点:`);
  console.log(`  - GET  /api/posts        - 获取博客清单`);
  console.log(`  - GET  /api/posts/:category/:slug - 获取博客内容`);
  console.log(`  - DELETE /api/posts/:category/:slug - 删除博客文章`);
  console.log(`  - GET  /api/config       - 获取配置信息`);
  console.log(`  - GET  /api/maintain     - 手动维护博客索引`);
  console.log(`  - POST /api/upload       - 上传 Markdown 文件`);
});

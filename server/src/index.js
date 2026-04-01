import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import maintainBlogIndex from './scanPosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toLocaleString('zh-CN')} - ${req.method} ${req.url}`);
  next();
});

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

app.listen(PORT, () => {
  maintainBlogIndex();
  console.log(`博客后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点:`);
  console.log(`  - GET /api/posts        - 获取博客清单`);
  console.log(`  - GET /api/posts/:category/:slug - 获取博客内容`);
  console.log(`  - GET /api/config       - 获取配置信息`);
  console.log(`  - GET /api/maintain     - 手动维护博客索引`);
});

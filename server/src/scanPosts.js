import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanDirectory(dir) {
  const posts = [];

  if (!fs.existsSync(dir)) {
    console.log(`⚠️  目录不存在: ${dir}`);
    return posts;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && file.endsWith('.md')) {
      const slug = path.basename(file, '.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      const birthTime = stat.birthtime || stat.mtime;
      const postInfo = extractPostInfo(content, slug, birthTime);
      posts.push(postInfo);
    }
  });

  return posts;
}

function extractPostInfo(content, slug, birthTime) {
  const lines = content.split('\n');

  let title = slug;
  let description = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      title = trimmed.substring(2).trim();
      title = title.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').trim();
      break;
    }
  }

  const descriptionMatch = content.match(/Given[\s\S]{10,200}?(?=\n\n|\n#|$)/i);
  if (descriptionMatch) {
    description = descriptionMatch[0].trim()
      .replace(/\n+/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .substring(0, 200);
    if (description.length === 200) {
      description += '...';
    }
  }

  return {
    slug,
    title,
    description,
    date: new Date(birthTime).toISOString().split('T')[0],
    tags: []
  };
}

function maintainBlogIndex() {
  const postsDir = path.join(__dirname, '../posts');
  const dataDir = path.join(__dirname, '../data');
  const blogIndexPath = path.join(dataDir, 'blogIndex.json');

  console.log('\n🔍 开始扫描博客文章...\n');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 读取已有索引（用于保留 AI 生成的内容）
  let existingIndex = [];
  if (fs.existsSync(blogIndexPath)) {
    try {
      existingIndex = JSON.parse(fs.readFileSync(blogIndexPath, 'utf-8'));
    } catch (e) {
      existingIndex = [];
    }
  }

  const allPosts = scanDirectory(postsDir);

  // 合并数据：保留已有数据，用新数据覆盖 slug/title/date
  const mergedPosts = allPosts.map(newPost => {
    const existing = existingIndex.find(p => p.slug === newPost.slug);
    if (existing) {
      return {
        ...newPost,
        tags: existing.tags || [],
        description: existing.description || '',
        category: existing.category || ''
      };
    }
    return newPost;
  });

  // 移除已不存在的文章
  const slugs = new Set(allPosts.map(p => p.slug));
  const filteredExisting = existingIndex.filter(p => slugs.has(p.slug));

  // 合并并排序
  const finalPosts = [...mergedPosts, ...filteredExisting];
  const uniquePosts = Array.from(
    new Map(finalPosts.map(p => [p.slug, p])).values()
  );
  uniquePosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(blogIndexPath, JSON.stringify(uniquePosts, null, 2), 'utf-8');

  console.log('✅ 博客索引已更新!');
  console.log(`📊 总文章数: ${uniquePosts.length}`);
  console.log(`📁 索引文件: ${blogIndexPath}\n`);

  return uniquePosts;
}

if (process.argv[1] && process.argv[1].endsWith('scanPosts.js')) {
  maintainBlogIndex();
}

export default maintainBlogIndex;

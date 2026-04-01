import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanDirectory(dir, category) {
  const posts = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  目录不存在: ${dir}`);
    return posts;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const subPosts = scanDirectory(filePath, file);
      posts.push(...subPosts);
    } else if (file.endsWith('.md')) {
      const slug = path.basename(file, '.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      const birthTime = stat.birthtime || stat.mtime;
      const postCategory = category || path.basename(dir);
      const postInfo = extractPostInfo(content, slug, postCategory, birthTime);
      posts.push(postInfo);
    }
  });
  
  return posts;
}

function extractPostInfo(content, slug, category, birthTime) {
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
  
  const tags = detectTags(content, category);
  
  return {
    slug,
    title,
    description,
    category,
    date: new Date(birthTime).toISOString().split('T')[0],
    tags
  };
}

function detectTags(content, category) {
  const tags = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('array') || lowerContent.includes('list')) {
    tags.push('Array');
  }
  if (lowerContent.includes('linked list') || lowerContent.includes('listnode')) {
    tags.push('Linklist');
  }
  if (lowerContent.includes('hash') || lowerContent.includes('map')) {
    tags.push('Hash Table');
  }
  if (lowerContent.includes('two pointer') || lowerContent.includes('双指针')) {
    tags.push('Two Pointers');
  }
  if (lowerContent.includes('binary search') || lowerContent.includes('二分')) {
    tags.push('Binary Search');
  }
  if (lowerContent.includes('dynamic programming') || lowerContent.includes('dp')) {
    tags.push('Dynamic Programming');
  }
  if (lowerContent.includes('recursion') || lowerContent.includes('recursive')) {
    tags.push('Recursion');
  }
  if (lowerContent.includes('matrix') || lowerContent.includes('二维')) {
    tags.push('Matrix');
  }
  if (lowerContent.includes('string')) {
    tags.push('String');
  }
  if (lowerContent.includes('sorting')) {
    tags.push('Sorting');
  }
  if (lowerContent.includes('math')) {
    tags.push('Math');
  }
  
  if (tags.length === 0) {
    tags.push(category.charAt(0).toUpperCase() + category.slice(1));
  }
  
  return [...new Set(tags)];
}

function maintainBlogIndex() {
  const postsDir = path.join(__dirname, '../posts');
  const dataDir = path.join(__dirname, '../data');
  const blogIndexPath = path.join(dataDir, 'blogIndex.json');
  
  console.log('\n🔍 开始扫描博客文章...\n');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const allPosts = scanDirectory(postsDir, '');
  
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  fs.writeFileSync(blogIndexPath, JSON.stringify(allPosts, null, 2), 'utf-8');
  
  const categoryStats = {};
  allPosts.forEach(post => {
    if (categoryStats[post.category]) {
      categoryStats[post.category]++;
    } else {
      categoryStats[post.category] = 1;
    }
  });
  
  console.log('✅ 博客索引已更新!');
  console.log(`📊 总文章数: ${allPosts.length}`);
  Object.keys(categoryStats).forEach(category => {
    console.log(`   - ${category}: ${categoryStats[category]} 篇`);
  });
  console.log(`📁 索引文件: ${blogIndexPath}\n`);
  
  return allPosts;
}

if (process.argv[1] && process.argv[1].endsWith('scanPosts.js')) {
  maintainBlogIndex();
}

export default maintainBlogIndex;

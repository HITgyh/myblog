<template>
  <div class="home-page">
    <header v-if="configData" class="profile-section">
      <div class="profile-container">
        <img 
          v-if="configData.avatar" 
          :src="configData.avatar" 
          alt="Avatar" 
          class="avatar"
        />
        <div class="profile-info">
          <h1>{{ configData.name }}</h1>
          <p class="email">✉️ {{ configData.email }}</p>
        </div>
        <button class="upload-btn" @click="openUploadDialog">
          📤 上传文章
        </button>
      </div>
    </header>

    <main class="main-content">
      <aside class="category-sidebar">
        <h3>博客分类</h3>
        <ul class="category-list">
          <li 
            class="category-item"
            :class="{ active: selectedCategory === 'all' }"
            @click="selectCategory('all')"
          >
            全部 ({{ blogPosts.length }})
          </li>
          <li 
            v-for="entry in Object.entries(categoryMap)" 
            :key="entry[0]"
            class="category-item"
            :class="{ active: selectedCategory === entry[0] }"
            @click="selectCategory(entry[0])"
          >
            {{ entry[0] }} ({{ entry[1] }})
          </li>
        </ul>
      </aside>

      <section class="blog-list-section">
        <template v-if="!currentPost">
          <h2 v-if="selectedCategory === 'all'">我的博客</h2>
          <h2 v-else>{{ selectedCategory }}</h2>
          
          <article 
            v-for="post in paginatedPosts" 
            :key="post.slug"
            class="blog-post-card"
            @click="showPostDetail(post)"
          >
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-date">{{ formatDate(post.date) }}</p>
            <p class="post-excerpt">{{ post.description }}</p>
          </article>

          <div v-if="totalPages > 1" class="pagination">
            <button 
              class="page-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ← 上一页
            </button>
            
            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-number"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              class="page-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页 →
            </button>
          </div>
        </template>

        <template v-else>
          <article class="post-detail">
            <header class="post-detail-header">
              <div class="post-header-top">
                <button class="back-button" @click="closePostDetail">
                  ← 返回列表
                </button>
                <button class="delete-btn" @click="handleDelete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                  </svg>
                </button>
              </div>
              <div class="post-meta">
                <span class="post-category">{{ currentPost.category }}</span>
                <span class="post-date">{{ formatDate(currentPost.date) }}</span>
              </div>
              <h1 class="post-title">{{ currentPost.title }}</h1>
              <div class="post-tags">
                <span 
                  v-for="tag in currentPost.tags" 
                  :key="tag" 
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </header>
            
            <div v-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>正在加载文章内容...</p>
            </div>
            
            <div v-else-if="postContent" class="post-content" v-html="postContent"></div>
            
            <div v-else class="error-container">
              <p>无法加载文章内容</p>
            </div>
          </article>
        </template>
      </section>
    </main>

    <el-dialog
      v-model="uploadDialogVisible"
      title="上传博客文章"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="upload-form">
        <div class="form-item">
          <label>选择或输入分类</label>
          <el-select
            v-model="uploadCategory"
            placeholder="选择或输入新分类"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
          >
            <el-option
              v-for="entry in Object.entries(categoryMap)"
              :key="entry[0]"
              :label="entry[0]"
              :value="entry[0]"
            />
          </el-select>
          <p class="category-hint">可以输入新分类名来创建</p>
        </div>
        <div class="form-item">
          <label>选择文件</label>
          <input
            type="file"
            accept=".md"
            @change="handleFileChange"
            class="file-input"
          />
          <p class="file-hint">只支持 .md 格式的 Markdown 文件</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!uploadFile"
          @click="handleUpload"
        >
          {{ uploading ? '上传中...' : '上传' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { marked } from 'marked';
import { ElMessage, ElMessageBox } from 'element-plus';

const configData = ref(null);
const blogPosts = ref([]);
const selectedCategory = ref('all');
const currentPage = ref(1);
const postsPerPage = 8;
const currentPost = ref(null);
const postContent = ref('');
const loading = ref(false);
const uploadDialogVisible = ref(false);
const uploadCategory = ref('leetcode');
const uploadFile = ref(null);
const uploading = ref(false);

const categoryMap = computed(() => {
  const map = {};
  blogPosts.value.forEach(post => {
    if (map[post.category]) {
      map[post.category]++;
    } else {
      map[post.category] = 1;
    }
  });
  return map;
});

const filteredBlogPosts = computed(() => {
  let posts = [...blogPosts.value];
  
  if (selectedCategory.value !== 'all') {
    posts = posts.filter(post => post.category === selectedCategory.value);
  }
  
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
});

const totalPages = computed(() => {
  return Math.ceil(filteredBlogPosts.value.length / postsPerPage);
});

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  return filteredBlogPosts.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      for (let i = current - 2; i <= current + 2; i++) {
        pages.push(i);
      }
    }
  }
  
  return pages;
});

const selectCategory = (category) => {
  if (currentPost.value) {
    closePostDetail();
  }
  selectedCategory.value = category;
  currentPage.value = 1;
};

const goToPage = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch(selectedCategory, () => {
  currentPage.value = 1;
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const showPostDetail = async (post) => {
  currentPost.value = post;
  loading.value = true;
  postContent.value = '';
  
  try {
    const response = await fetch(`/api/posts/${post.category}/${post.slug}`);
    
    if (!response.ok) {
      throw new Error('无法加载文章内容');
    }
    
    const content = await response.text();
    postContent.value = marked.parse(content);
  } catch (error) {
    console.error('加载文章失败:', error);
    postContent.value = '<p>加载失败</p>';
  } finally {
    loading.value = false;
  }
};

const closePostDetail = () => {
  currentPost.value = null;
  postContent.value = '';
};

const handleDelete = async () => {
  if (!currentPost.value) return;

  try {
    await ElMessageBox.confirm(
      '确定要将这篇文章移至回收站吗？',
      '删除文章',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'delete-confirm-btn'
      }
    );

    const response = await fetch(`/api/posts/${currentPost.value.category}/${currentPost.value.slug}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      ElMessage.success('文章已移至回收站');
      closePostDetail();
      // 刷新文章列表
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        blogPosts.value = await postsRes.json();
      }
    } else {
      const result = await response.json();
      ElMessage.error(result.error || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败，请重试');
    }
  }
};

const openUploadDialog = () => {
  uploadCategory.value = selectedCategory.value === 'all' ? 'leetcode' : selectedCategory.value;
  uploadDialogVisible.value = true;
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.name.endsWith('.md')) {
      ElMessage.error('只支持 Markdown 文件');
      event.target.value = '';
      uploadFile.value = null;
      return;
    }
    uploadFile.value = file;
  }
};

const handleUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.error('请选择要上传的文件');
    return;
  }

  uploading.value = true;
  const formData = new FormData();
  formData.append('file', uploadFile.value);
  formData.append('category', uploadCategory.value);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      ElMessage.success('上传成功！');
      uploadDialogVisible.value = false;
      uploadFile.value = null;
      document.querySelector('input[type="file"]').value = '';
      // 刷新文章列表
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        blogPosts.value = await postsRes.json();
      }
    } else {
      ElMessage.error(result.error || '上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error('上传失败，请重试');
  } finally {
    uploading.value = false;
  }
};

marked.setOptions({
  breaks: true,
  gfm: true
});

onMounted(async () => {
  try {
    const [configRes, postsRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/posts')
    ]);

    if (configRes.ok) {
      configData.value = await configRes.json();
    }

    if (postsRes.ok) {
      blogPosts.value = await postsRes.json();
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    configData.value = { name: '加载失败', bio: '无法加载个人信息' };
  }
});
</script>

<style scoped>
.home-page {
  background-color: #fafbfc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.profile-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.2);
}

.profile-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.avatar:hover {
  transform: scale(1.05);
}

.profile-info {
  color: white;
}

.profile-info h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.email {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.upload-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.upload-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

.main-content {
  display: flex;
  gap: 2.5rem;
  max-width: 1280px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.category-sidebar {
  flex: 0 0 280px;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 2rem;
}
.category-sidebar h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f0f0f0;
}
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.category-item {
  padding: 0.75rem 1rem;
  margin-bottom: 0.375rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #4a4a68;
  font-size: 0.95rem;
  border: 1px solid transparent;
}
.category-item:hover {
  background: #f7f8fc;
  color: #667eea;
  padding-left: 1.25rem;
}
.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
  padding-left: 1.25rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.blog-list-section {
  flex: 1;
  min-width: 0;
}
.blog-list-section h2 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a2e;
}

.blog-post-card {
  background: white;
  border: 1px solid #eef0f5;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  cursor: pointer;
}
.blog-post-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
  border-color: #d4d7e3;
}

.post-title {
  margin: 0 0 0.75rem;
  color: #1a1a2e;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  transition: color 0.3s ease;
}
.blog-post-card:hover .post-title {
  color: #667eea;
}

.post-date {
  margin: 0 0 0.75rem;
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.post-excerpt {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.95rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem 0;
}

.page-btn {
  background: white;
  border: 1px solid #eef0f5;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
}
.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  background: white;
  border: 1px solid #eef0f5;
  color: #4a4a68;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-number:hover {
  background: #f7f8fc;
  border-color: #667eea;
  color: #667eea;
}
.page-number.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.post-detail {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.post-detail-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  color: white;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}
.back-button:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateX(-4px);
}

.post-header-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.post-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.85);
  border-color: rgba(239, 68, 68, 0.85);
  transform: scale(1.05);
}

.post-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.post-category {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: 500;
}

.post-detail-header .post-title {
  margin: 0 0 1rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: white;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  padding: 4rem 2rem;
  text-align: center;
  color: #ef4444;
}

.post-content {
  padding: 2rem;
  font-size: 1rem;
  line-height: 1.8;
  color: #4a4a68;
}

.post-content :deep(h1) {
  font-size: 1.75rem;
  color: #1a1a2e;
  margin: 2rem 0 1rem;
  font-weight: 600;
}

.post-content :deep(h2) {
  font-size: 1.5rem;
  color: #1a1a2e;
  margin: 1.75rem 0 1rem;
  font-weight: 600;
}

.post-content :deep(h3) {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin: 1.5rem 0 1rem;
  font-weight: 600;
}

.post-content :deep(p) {
  margin: 1rem 0;
}

.post-content :deep(code) {
  background: #f4f3ec;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 0.9em;
  color: #aa3bff;
}

.post-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.9rem;
  line-height: 1.6;
}

.upload-form {
  padding: 1rem 0;
}

.form-item {
  margin-bottom: 1.5rem;
}

.form-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #1a1a2e;
}

.file-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #d4d7e3;
  border-radius: 8px;
  cursor: pointer;
  background: #fafbfc;
  transition: all 0.3s ease;
}

.file-input:hover {
  border-color: #667eea;
  background: #f7f8fc;
}

.file-hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #9ca3af;
}

.category-hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #9ca3af;
}

/* 上传对话框样式 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 1.25rem 1.5rem;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

:deep(.el-dialog__headerbtn) {
  display: none;
}

:deep(.el-dialog__body) {
  padding: 1.5rem 2rem;
  background: white;
}

:deep(.el-dialog__footer) {
  padding: 1rem 1.5rem;
  background: #fafbfc;
  border-top: 1px solid #eef0f5;
}

:deep(.delete-confirm-btn) {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
}

:deep(.delete-confirm-btn:hover) {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
  font-weight: 500;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

:deep(.el-button--default) {
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
}

:deep(.el-button--default:hover) {
  border-color: #667eea;
  color: #667eea;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #eef0f5;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

@media (max-width: 968px) {
  .main-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1rem;
    margin: 1.5rem auto;
  }

  .profile-section {
    padding: 1rem 1.5rem;
  }

  .profile-container {
    gap: 1rem;
  }

  .avatar {
    width: 56px;
    height: 56px;
  }

  .profile-info h1 {
    font-size: 1.25rem;
  }

  .email {
    font-size: 0.85rem;
  }

  .upload-btn {
    margin-left: 0;
    margin-top: 0.5rem;
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }
  
  .category-sidebar {
    flex: none;
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 1rem;
  }
  
  .category-sidebar h3 {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  
  .category-item {
    margin-bottom: 0;
    padding: 0.375rem 0.875rem;
    background: #f5f6fa;
    font-size: 0.9rem;
  }
  
  .category-item.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .blog-post-card {
    padding: 1.25rem;
  }
  
  .post-title {
    font-size: 1.1rem;
  }
  
  .pagination {
    gap: 0.5rem;
  }
  
  .page-number {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .post-detail-header {
    padding: 1.5rem;
  }
  
  .post-detail-header .post-title {
    font-size: 1.5rem;
  }
  
  .back-button {
    margin-bottom: 0;
  }

  .post-header-buttons {
    margin-bottom: 1rem;
  }

  .post-header-top {
    margin-bottom: 1rem;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
  }

  .delete-btn svg {
    width: 16px;
    height: 16px;
  }

  .post-content {
    padding: 1.5rem;
    font-size: 0.95rem;
  }
}
</style>

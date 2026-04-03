<template>
  <div class="post-detail-page">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载文章...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>文章加载失败</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="back-button">返回首页</button>
    </div>

    <article v-else class="post-article">
      <header class="post-header">
        <button @click="goBack" class="back-button">
          ← 返回
        </button>
        
        <div class="post-meta">
          <span class="post-category">{{ postData?.category || '未分类' }}</span>
          <span class="post-date">{{ formatDate(postData?.date) }}</span>
        </div>
        
        <h1 class="post-title">{{ postData?.title }}</h1>
        
        <div class="post-tags">
          <span v-for="tag in postData?.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </header>

      <div class="post-content" v-html="postContent"></div>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'

const router = useRouter()

const props = defineProps({
  slug: {
    type: String,
    required: true
  }
})

const loading = ref(true)
const error = ref(null)
const postContent = ref('')
const postData = ref(null)

marked.setOptions({
  breaks: true,
  gfm: true
})

const loadPostData = async () => {
  loading.value = true
  error.value = null

  try {
    const [postRes, contentRes] = await Promise.all([
      fetch('/api/posts'),
      fetch(`/api/posts/${props.slug}`)
    ])

    if (!postRes.ok || !contentRes.ok) {
      throw new Error('文章不存在或加载失败')
    }

    const posts = await postRes.json()
    postData.value = posts.find(post => post.slug === props.slug)

    const content = await contentRes.text()
    postContent.value = marked.parse(content)
    
  } catch (err) {
    console.error('加载文章失败:', err)
    error.value = err.message || '文章不存在或加载失败'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  loadPostData()
})
</script>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-container h2 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.post-article {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.post-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 3rem 3rem 2rem;
  color: white;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  display: inline-block;
  text-decoration: none;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateX(-4px);
}

.post-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

.post-category {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: 500;
}

.post-title {
  margin: 0 0 1.5rem;
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
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
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.post-content {
  padding: 3rem;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #4a4a68;
}

.post-content :deep(h1) {
  font-size: 2rem;
  color: #1a1a2e;
  margin: 2rem 0 1rem;
  font-weight: 600;
}

.post-content :deep(h2) {
  font-size: 1.75rem;
  color: #1a1a2e;
  margin: 1.75rem 0 1rem;
  font-weight: 600;
}

.post-content :deep(h3) {
  font-size: 1.5rem;
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
  font-family: 'Fira Code', monospace;
  font-size: 0.95em;
  color: #aa3bff;
}

.post-content :deep(strong) {
  color: #1a1a2e;
  font-weight: 600;
}

.post-content :deep(a) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.post-content :deep(a:hover) {
  border-bottom-color: #667eea;
}

.post-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #333;
}

.post-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.post-content :deep(blockquote) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left: 4px solid #667eea;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
}

.post-content :deep(ul),
.post-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.post-content :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.7;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-content :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 2rem 0;
  border-radius: 1px;
}

@media (max-width: 768px) {
  .post-header {
    padding: 2rem 1.5rem 1.5rem;
  }
  
  .post-title {
    font-size: 2rem;
  }
  
  .post-content {
    padding: 2rem 1.5rem;
    font-size: 1rem;
  }
}
</style>

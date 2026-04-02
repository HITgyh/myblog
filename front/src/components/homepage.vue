<template>
  <div class="home-page">
    <!-- 头部区域 -->
    <header v-if="configData" class="profile-section">
      <div class="profile-container">
        <el-image
          :src="configData.avatar"
          class="avatar"
          fit="cover"
          :preview-src-list="[configData.avatar]"
          preview-teleported
        >
          <template #error>
            <el-icon :size="32"><User /></el-icon>
          </template>
        </el-image>
        <div class="profile-info">
          <div class="name-row">
            <h1>{{ configData.name }}</h1>
            <el-button v-if="isAdmin" text bg class="edit-profile-btn" @click="openEditProfileDialog">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          <p class="bio" v-if="configData.bio">{{ configData.bio }}</p>
          <div class="contact-row">
            <span class="contact-item" v-if="configData.email">
              <el-icon><Message /></el-icon>
              {{ configData.email }}
            </span>
            <span class="contact-item" v-if="configData.location">
              <el-icon><Location /></el-icon>
              {{ configData.location }}
            </span>
          </div>
          <div class="social-links" v-if="configData.socialLinks && configData.socialLinks.length">
            <a
              v-for="link in configData.socialLinks"
              :key="link.name"
              :href="link.url"
              target="_blank"
              class="social-link"
            >
              <el-icon><Link /></el-icon>
              {{ link.name }}
            </a>
          </div>
        </div>
        <el-button v-if="!isAdmin" class="login-btn" @click="openLoginDialog">
          <el-icon><UserFilled /></el-icon>
          管理员登录
        </el-button>
        <template v-if="isAdmin">
          <el-button class="logout-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
          <el-tooltip content="上传 Markdown 文章" placement="bottom">
            <el-button type="primary" class="upload-btn" @click="openUploadDialog">
              <el-icon><Upload /></el-icon>
              上传文章
            </el-button>
          </el-tooltip>
          <el-tooltip content="AI 自动分析文章并打标签归类" placement="bottom">
            <el-button type="warning" class="organize-btn" :loading="organizing" @click="handleOrganizeAll">
              <el-icon><MagicStick /></el-icon>
              AI 整理
            </el-button>
          </el-tooltip>
        </template>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 分类侧边栏 -->
      <aside class="category-sidebar">
        <div class="sidebar-header">
          <el-icon><Folder /></el-icon>
          <span>分类</span>
        </div>
        <el-scrollbar height="calc(100vh - 280px)">
          <div class="category-list">
            <div
              class="category-item"
              :class="{ active: selectedCategory === 'all' }"
              @click="selectCategory('all')"
            >
              <el-icon><Document /></el-icon>
              <span class="category-name">全部文章</span>
              <el-tag size="small" type="info">{{ blogPosts.length }}</el-tag>
            </div>
            <div
              v-for="(count, category) in categoryMap"
              :key="category"
              class="category-item"
              :class="{ active: selectedCategory === category }"
              @click="selectCategory(category)"
            >
              <el-icon>
                <component :is="getCategoryIcon(category)" />
              </el-icon>
              <span class="category-name">{{ category }}</span>
              <el-tag size="small" type="info">{{ count }}</el-tag>
            </div>
          </div>
        </el-scrollbar>
      </aside>

      <!-- 博客列表/详情区域 -->
      <section class="blog-list-section">
        <!-- 列表视图 -->
        <template v-if="!currentPost">
          <div class="section-header">
            <h2>
              <el-icon><Reading /></el-icon>
              {{ selectedCategory === 'all' ? '全部文章' : categoryNames[selectedCategory] || selectedCategory }}
            </h2>
            <span class="post-count">共 {{ filteredBlogPosts.length }} 篇</span>
          </div>

          <!-- 骨架屏加载 -->
          <div v-if="loading" class="article-list">
            <el-skeleton v-for="i in 4" :key="i" animated class="skeleton-card">
              <template #template>
                <el-skeleton-item variant="h3" style="width: 60%" />
                <el-skeleton-item variant="text" style="width: 30%; margin-top: 12px" />
                <el-skeleton-item variant="text" style="margin-top: 16px" />
                <el-skeleton-item variant="text" style="width: 90%" />
              </template>
            </el-skeleton>
          </div>

          <!-- 空状态 -->
          <el-empty v-else-if="filteredBlogPosts.length === 0" :description="emptyText">
            <el-button type="primary" @click="openUploadDialog">
              <el-icon><Upload /></el-icon>
              上传第一篇文章
            </el-button>
          </el-empty>

          <!-- 文章列表 -->
          <transition-group v-else name="article" tag="div" class="article-list">
            <article
              v-for="post in paginatedPosts"
              :key="post.slug"
              class="blog-post-card"
              @click="showPostDetail(post)"
            >
              <div class="card-header">
                <div class="card-meta">
                  <el-tag size="small" effect="plain" :type="getCategoryType(post.category)">
                    <el-icon><component :is="getCategoryIcon(post.category)" /></el-icon>
                    {{ post.category }}
                  </el-tag>
                  <span class="post-date">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(post.date) }}
                  </span>
                </div>
                <h3 class="post-title">{{ post.title }}</h3>
              </div>
              <p class="post-excerpt">{{ post.description }}</p>
              <div class="card-footer">
                <div class="post-tags">
                  <el-tag
                    v-for="tag in post.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    effect="light"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <span class="read-more">
                  阅读全文
                  <el-icon><ArrowRight /></el-icon>
                </span>
              </div>
            </article>
          </transition-group>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="postsPerPage"
              :total="filteredBlogPosts.length"
              layout="prev, pager, next"
              background
            />
          </div>
        </template>

        <!-- 详情视图 -->
        <template v-else>
          <transition name="detail" appear>
            <article class="post-detail">
              <header class="post-detail-header">
                <div class="post-header-top">
                  <el-button text bg @click="closePostDetail">
                    <el-icon><ArrowLeft /></el-icon>
                    返回列表
                  </el-button>
                  <el-button v-if="isAdmin" text bg class="delete-btn" @click="handleDelete">
                    <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    删除
                  </el-button>
                </div>
                <div class="post-meta">
                  <span class="post-date">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(currentPost.date) }}
                  </span>
                </div>
                <h1 class="post-title">{{ currentPost.title }}</h1>
                <div class="post-tags">
                  <el-tag
                    v-for="tag in currentPost.tags"
                    :key="tag"
                    effect="light"
                    :type="getTagType(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </header>

              <div v-if="loading" class="loading-container">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="h1" style="width: 40%; margin-bottom: 24px" />
                    <el-skeleton-item variant="text" v-for="i in 8" :key="i" />
                  </template>
                </el-skeleton>
              </div>

              <div v-else-if="postContent" class="post-content" v-html="postContent"></div>

              <div v-else class="error-container">
                <el-result
                  icon="error"
                  title="加载失败"
                  sub-title="无法获取文章内容，请稍后重试"
                >
                  <template #extra>
                    <el-button type="primary" @click="showPostDetail(currentPost)">
                      重试
                    </el-button>
                  </template>
                </el-result>
              </div>
            </article>
          </transition>
        </template>
      </section>
    </main>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传博客文章"
      width="500px"
      :close-on-click-modal="false"
      class="upload-dialog"
    >
      <el-form class="upload-form" label-position="top">
        <div class="upload-tip">
          <el-icon><MagicStick /></el-icon>
          上传后 AI 将自动进行分类归档
        </div>
        <el-form-item label="选择文件">
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".md"
            @change="handleFileChange"
            @exceed="handleExceed"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              <span>拖拽文件到此处或 <em>点击上传</em></span>
              <span class="upload-hint">只支持 .md 格式的 Markdown 文件</span>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!uploadFile"
          @click="handleUpload"
        >
          <el-icon v-if="!uploading"><Upload /></el-icon>
          {{ uploading ? '上传中...' : '上传文章' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 管理员登录对话框 -->
    <el-dialog
      v-model="loginDialogVisible"
      title="管理员登录"
      width="400px"
      :close-on-click-modal="false"
      class="login-dialog"
    >
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="请输入管理员密码">
          <el-input
            v-model="loginPassword"
            type="password"
            placeholder="输入管理员密码"
            size="large"
            autocomplete="off"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="loginDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loginLoading" @click="handleLogin">
          登录
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑个人信息对话框 -->
    <el-dialog
      v-model="editProfileDialogVisible"
      title="编辑个人信息"
      width="500px"
      :close-on-click-modal="false"
      class="edit-profile-dialog"
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" placeholder="请输入姓名" size="large" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="2" placeholder="请输入简介" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="editForm.location" placeholder="请输入位置" size="large" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" size="large" />
        </el-form-item>
        <el-form-item label="社交链接">
          <div v-for="(link, index) in editForm.socialLinks" :key="index" class="social-link-edit">
            <el-input v-model="link.name" placeholder="名称（如：GitHub）" size="large" />
            <el-input v-model="link.url" placeholder="链接（如：https://github.com/user）" size="large" />
            <el-button type="danger" @click="removeSocialLink(index)" :icon="Delete" circle />
          </div>
          <el-button type="default" @click="addSocialLink" size="large">添加链接</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProfileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleSaveProfile">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, markRaw } from 'vue';
import { marked } from 'marked';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  User,
  Message,
  Location,
  Upload,
  Folder,
  Document,
  Reading,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Delete,
  UploadFilled,
  Star,
  Grid,
  Link,
  Box,
  SetUp,
  Monitor,
  Tools,
  Pointer,
  Promotion,
  MagicStick,
  DataLine,
  List,
  Collection,
  View,
  SwitchButton,
  Edit,
  UserFilled
} from '@element-plus/icons-vue';

const configData = ref(null);
const blogPosts = ref([]);
const selectedCategory = ref('all');
const currentPage = ref(1);
const postsPerPage = 8;
const currentPost = ref(null);
const postContent = ref('');
const loading = ref(false);
const uploadDialogVisible = ref(false);
const uploadFile = ref(null);
const uploading = ref(false);
const organizing = ref(false);
const isAdmin = ref(localStorage.getItem('isAdmin') === 'true');
const loginDialogVisible = ref(false);
const loginPassword = ref('');
const loginLoading = ref(false);

const editProfileDialogVisible = ref(false);
const editLoading = ref(false);

const editForm = ref({
  name: '',
  bio: '',
  location: '',
  email: '',
  socialLinks: []
});

const addSocialLink = () => {
  editForm.value.socialLinks.push({ name: '', url: '' });
};

const removeSocialLink = (index) => {
  editForm.value.socialLinks.splice(index, 1);
};

// 分类名称映射
const categoryNames = {
  leetcode: 'LeetCode 题解',
  vue: 'Vue 技术文章',
  algorithm: '算法与数据结构',
  frontend: '前端开发',
  backend: '后端开发',
  database: '数据库',
  devops: 'DevOps',
  other: '其他'
};

// 分类图标映射
const categoryIcons = {
  leetcode: markRaw(MagicStick),
  vue: markRaw(List),
  algorithm: markRaw(DataLine),
  frontend: markRaw(Grid),
  backend: markRaw(Box),
  database: markRaw(Collection),
  devops: markRaw(Monitor),
  other: markRaw(Star)
};

// 空状态文本
const emptyText = computed(() => {
  if (selectedCategory.value === 'all') {
    return '还没有文章，点击下方按钮上传第一篇文章';
  }
  return `暂无 ${categoryNames[selectedCategory.value] || selectedCategory.value} 分类的文章`;
});

// 获取分类图标
const getCategoryIcon = (category) => {
  return categoryIcons[category] || Star;
};

// 获取分类标签类型
const getCategoryType = (category) => {
  const types = {
    leetcode: '',
    vue: 'success',
    algorithm: 'warning',
    frontend: 'info',
    backend: '',
    database: 'danger',
    devops: 'warning',
    other: 'info'
  };
  return types[category] || 'info';
};

// 获取标签类型（根据标签名分配不同颜色）
const getTagType = (tag) => {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('array') || tagLower.includes('list')) return '';
  if (tagLower.includes('linked') || tagLower.includes('list')) return 'success';
  if (tagLower.includes('tree') || tagLower.includes('binary')) return 'warning';
  if (tagLower.includes('dynamic') || tagLower.includes('dp')) return 'danger';
  if (tagLower.includes('string')) return 'info';
  if (tagLower.includes('hash')) return '';
  if (tagLower.includes('two pointer') || tagLower.includes('pointer')) return 'success';
  if (tagLower.includes('binary search') || tagLower.includes('search')) return 'warning';
  return 'info';
};

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
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
  uploadDialogVisible.value = true;
};

const openLoginDialog = () => {
  loginPassword.value = '';
  loginDialogVisible.value = true;
};

const handleLogin = async () => {
  if (!loginPassword.value) {
    ElMessage.error('请输入密码');
    return;
  }

  loginLoading.value = true;

  try {
    const response = await fetch('/api/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: loginPassword.value })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      isAdmin.value = true;
      localStorage.setItem('isAdmin', 'true');
      loginDialogVisible.value = false;
      ElMessage.success('登录成功');
    } else {
      ElMessage.error(result.error || '密码错误');
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请重试');
  } finally {
    loginLoading.value = false;
  }
};

const handleLogout = () => {
  isAdmin.value = false;
  localStorage.removeItem('isAdmin');
  ElMessage.success('已退出登录');
};

const openEditProfileDialog = () => {
  editForm.value = {
    name: configData.value?.name || '',
    bio: configData.value?.bio || '',
    location: configData.value?.location || '',
    email: configData.value?.email || '',
    socialLinks: configData.value?.socialLinks ? [...configData.value.socialLinks] : []
  };
  editProfileDialogVisible.value = true;
};

const handleSaveProfile = async () => {
  if (!editForm.value.name) {
    ElMessage.error('请输入姓名');
    return;
  }

  editLoading.value = true;

  try {
    const response = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.value.name,
        bio: editForm.value.bio,
        location: editForm.value.location,
        email: editForm.value.email,
        socialLinks: editForm.value.socialLinks
      })
    });

    const result = await response.json();

    if (response.ok) {
      ElMessage.success('保存成功');
      editProfileDialogVisible.value = false;
      // 刷新配置数据
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        configData.value = await configRes.json();
      }
    } else {
      ElMessage.error(result.error || '保存失败');
    }
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败，请重试');
  } finally {
    editLoading.value = false;
  }
};

const handleFileChange = (uploadFile_) => {
  uploadFile.value = uploadFile_.raw;
};

const handleExceed = () => {
  ElMessage.warning('最多只能上传 1 个文件');
};

const handleUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.error('请选择要上传的文件');
    return;
  }

  uploading.value = true;
  const formData = new FormData();
  formData.append('file', uploadFile.value);
  formData.append('category', 'blog');

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      ElMessage.success('上传成功，正在 AI 整理...');

      // 获取文件名作为 slug（去掉.md扩展名）
      const slug = uploadFile.value.name.replace('.md', '');

      // 调用 AI 整理接口
      try {
        const organizeRes = await fetch('/api/ai/organize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: 'blog', slug })
        });

        const organizeResult = await organizeRes.json();

        if (organizeRes.ok && organizeResult.success) {
          ElMessage.success('AI 整理完成！');
        } else if (organizeResult.isApiKeyError) {
          ElMessage.error({
            message: organizeResult.error + '，请参照 README 文档正确配置 API-key',
            duration: 5000
          });
        } else if (!organizeRes.ok) {
          ElMessage.error(organizeResult.error || 'AI 整理失败');
        }
      } catch (error) {
        console.error('AI 整理失败:', error);
      }

      uploadDialogVisible.value = false;
      uploadFile.value = null;

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

const handleOrganizeAll = async () => {
  try {
    await ElMessageBox.confirm(
      'AI 将分析所有文章并自动打标签和归类，是否继续？',
      'AI 整理',
      {
        confirmButtonText: '开始整理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    organizing.value = true;

    const response = await fetch('/api/ai/organize-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      ElMessage.success(result.message || '整理完成！');
      // 刷新文章列表
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        blogPosts.value = await postsRes.json();
      }
    } else if (result.isApiKeyError) {
      ElMessage.error({
        message: result.error + '，请参照 README 文档正确配置 API-key',
        duration: 5000
      });
    } else {
      ElMessage.error(result.error || '整理失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('整理失败:', error);
      ElMessage.error('整理失败，请重试');
    }
  } finally {
    organizing.value = false;
  }
};

marked.setOptions({
  breaks: true,
  gfm: true
});

onMounted(async () => {
  loading.value = true;
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
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 头部样式 */
.profile-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.profile-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
}

.profile-info {
  color: white;
  flex: 1;
}

.profile-info h1 {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.edit-profile-btn {
  color: rgba(255, 255, 255, 0.5) !important;
  background: transparent !important;
  border: none !important;
  padding: 0.25rem !important;
  font-size: 1rem;
}

.edit-profile-btn:hover {
  color: white !important;
  background: transparent !important;
}

.social-link-edit {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.social-link-edit .el-input {
  flex: 1;
}

.bio {
  margin: 0.75rem 0 0;
  font-size: 1.1rem;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.9);
}

.contact-row {
  display: flex;
  gap: 2rem;
  margin-top: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  opacity: 0.85;
}

.social-links {
  display: flex;
  gap: 1.25rem;
  margin-top: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  transform: translateY(-2px);
}

.upload-btn,
.login-btn,
.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  transform: translateY(-2px);
}

.organize-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.organize-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  filter: brightness(1.1);
}

.login-btn,
.visitor-btn,
.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-btn:hover,
.visitor-btn:hover,
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
}

.logout-btn:hover {
  color: #ef4444;
}

.admin-buttons {
  display: flex;
  gap: 0.75rem;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

/* 侧边栏 */
.category-sidebar {
  flex: 0 0 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  height: fit-content;
  position: sticky;
  top: 2rem;
  overflow: hidden;
}

.sidebar-header {
  padding: 1.25rem 1.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: #1a1a2e;
  border-bottom: 1px solid #f0f0f5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-list {
  padding: 1rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin-bottom: 0.375rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #5a5a72;
  font-size: 0.95rem;
}

.category-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  padding-left: 1.25rem;
}

.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.category-item .category-name {
  flex: 1;
}

/* 博客列表区域 */
.blog-list-section {
  flex: 1;
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-count {
  color: #9ca3af;
  font-size: 0.9rem;
}

/* 文章卡片 */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.blog-post-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.blog-post-card:hover {
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.2);
}

.card-header {
  margin-bottom: 1rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.post-date {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #9ca3af;
  font-size: 0.85rem;
}

.blog-post-card .post-title {
  margin: 0;
  color: #1a1a2e;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.blog-post-card:hover .post-title {
  color: #667eea;
}

.post-excerpt {
  margin: 0 0 1rem;
  color: #6b7280;
  line-height: 1.7;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.read-more {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.blog-post-card:hover .read-more {
  opacity: 1;
  transform: translateX(0);
}

/* 骨架屏 */
.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding: 1.5rem 0;
}

/* 详情页 */
.post-detail {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.post-detail-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  color: white;
}

.post-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-button,
.delete-btn {
  color: #1a1a2e;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  background: #ffffff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.delete-icon {
  width: 18px;
  height: 18px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

.post-meta .el-tag {
  border-radius: 6px;
  font-weight: 500;
}

.category-tag {
  text-transform: capitalize;
  letter-spacing: 0.5px;
}

.post-detail-header .post-date {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.post-detail-header .post-title {
  margin: 0 0 1.25rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
  color: white;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.loading-container {
  padding: 3rem 2rem;
}

.error-container {
  padding: 3rem 2rem;
}

.post-content {
  padding: 2rem;
  font-size: 1rem;
  line-height: 1.8;
  color: #4a4a68;
}

/* 文章内容样式 */
.post-content :deep(h1) {
  font-size: 1.75rem;
  color: #1a1a2e;
  margin: 2rem 0 1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f5;
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

.post-content :deep(a) {
  color: #667eea;
  text-decoration: none;
}

.post-content :deep(a:hover) {
  text-decoration: underline;
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
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.post-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.9rem;
  line-height: 1.6;
}

.post-content :deep(ul),
.post-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.post-content :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.7;
}

.post-content :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding: 0.5rem 1rem;
  margin: 1.5rem 0;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 0 8px 8px 0;
}

/* 上传对话框 */
.upload-form {
  padding: 1rem 0;
}

.form-tip {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 3rem 2rem;
  border-radius: 12px;
  border: 2px dashed #d4d7e3;
  background: #fafbfc;
  transition: all 0.3s ease;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: #f7f8fc;
}

.upload-icon {
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #5a5a72;
}

.upload-text em {
  color: #667eea;
  font-style: normal;
}

.upload-hint {
  font-size: 0.85rem;
  color: #9ca3af;
}

.upload-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 过渡动画 */
.article-enter-active,
.article-leave-active {
  transition: all 0.4s ease;
}

.article-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.article-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.detail-enter-active {
  transition: all 0.5s ease;
}

.detail-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

/* 响应式 */
@media (max-width: 968px) {
  .main-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1rem;
    margin: 1.5rem auto;
  }

  .profile-section {
    padding: 1.5rem 1rem;
  }

  .profile-container {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .profile-info h1 {
    font-size: 1.5rem;
  }

  .contact-row {
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .social-links {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .upload-btn {
    width: 100%;
    justify-content: center;
  }

  .organize-btn {
    width: 100%;
    justify-content: center;
  }

  .login-btn,
  .visitor-btn,
  .logout-btn,
  .upload-btn,
  .organize-btn {
    width: 100%;
    justify-content: center;
  }

  .admin-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .category-sidebar {
    flex: none;
    position: static;
    border-radius: 12px;
  }

  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 1rem;
  }

  .category-item {
    margin-bottom: 0;
    padding: 0.5rem 1rem;
    background: #f5f6fa;
    border-radius: 8px;
  }

  .category-item.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .sidebar-header {
    display: none;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .blog-post-card {
    padding: 1.25rem;
  }

  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .read-more {
    opacity: 1;
    transform: none;
  }

  .post-detail-header {
    padding: 1.5rem;
  }

  .post-detail-header .post-title {
    font-size: 1.5rem;
  }

  .post-content {
    padding: 1.5rem;
    font-size: 0.95rem;
  }
}

/* Element Plus 覆盖样式 */
:deep(.el-tag) {
  border-radius: 6px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

:deep(.el-button.is-bg) {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
}

:deep(.el-button.is-bg:hover) {
  background: rgba(255, 255, 255, 0.25);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-dialog) {
  border-radius: 16px;
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
  padding: 2rem;
  background: white;
}

:deep(.el-dialog__footer) {
  padding: 1.25rem 1.5rem;
  background: #fafbfc;
  border-top: 1px solid #eef0f5;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1a1a2e;
}

:deep(.el-select__wrapper) {
  border-radius: 10px;
}

:deep(.delete-confirm-btn) {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
}

:deep(.el-tooltip__trigger:focus) {
  outline: none;
}

:deep(.el-popper.is-dark) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 0.85rem !important;
  padding: 8px 14px !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
}

:deep(.el-popper.is-dark .el-popper__arrow::before) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
}

:deep(.login-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.login-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 1.25rem 1.5rem;
}

:deep(.login-dialog .el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

:deep(.login-dialog .el-dialog__headerbtn) {
  display: none;
}

:deep(.login-dialog .el-dialog__body) {
  padding: 2rem;
  background: white;
}

:deep(.login-dialog .el-dialog__footer) {
  padding: 1.25rem 1.5rem;
  background: #fafbfc;
  border-top: 1px solid #eef0f5;
}

:deep(.edit-profile-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.edit-profile-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 1.25rem 1.5rem;
}

:deep(.edit-profile-dialog .el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

:deep(.edit-profile-dialog .el-dialog__headerbtn) {
  display: none;
}

:deep(.edit-profile-dialog .el-dialog__body) {
  padding: 2rem;
  background: white;
}

:deep(.edit-profile-dialog .el-dialog__footer) {
  padding: 1.25rem 1.5rem;
  background: #fafbfc;
  border-top: 1px solid #eef0f5;
}

:deep(.el-image) {
  width: 120px;
  height: 120px;
  border-radius: 50%;
}

:deep(.el-image__inner) {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

:deep(.el-image-viewer__wrapper) {
  background: rgba(0, 0, 0, 0.9) !important;
}

:deep(.el-image-viewer__img) {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
}
</style>

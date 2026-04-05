<template>
  <div class="home-page">
    <!-- 头部区域 -->
    <header v-if="configData" class="profile-section">
      <div class="profile-container">
        <div class="avatar-wrapper">
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
          <el-tooltip v-if="isAdmin" content="更换头像" placement="bottom">
            <el-button class="avatar-upload-btn" @click="triggerAvatarUpload">
              <el-icon><Camera /></el-icon>
            </el-button>
          </el-tooltip>
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style="display: none"
            @change="handleAvatarChange"
          />
        </div>
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
        <div class="admin-buttons">
          <el-button v-if="!isAdmin" class="login-btn" @click="openLoginDialog">
            <el-icon><UserFilled /></el-icon>
            管理员登录
          </el-button>
          <template v-if="isAdmin">
            <el-tooltip content="上传 Markdown 文章" placement="bottom">
              <el-button type="primary" class="upload-btn" @click="openUploadDialog">
                <el-icon><Upload /></el-icon>
                上传文章
              </el-button>
            </el-tooltip>
            <el-button class="logout-btn" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 分类侧边栏 -->
      <aside class="category-sidebar">
        <div class="sidebar-header">
          <el-icon><Folder /></el-icon>
          <span>文章</span>
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

            <div class="trash-section">
              <div
                class="category-item"
                :class="{ active: selectedCategory === '__trash__' }"
                @click="selectCategory('__trash__')"
              >
                <el-icon><Delete /></el-icon>
                <span class="category-name">垃圾箱</span>
                <el-tag v-if="trashPosts.length > 0" size="small" type="danger">{{ trashPosts.length }}</el-tag>
              </div>
            </div>

            <div class="category-section-title">分类</div>

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
              {{ selectedCategory === '__trash__' ? '回收站' : (selectedCategory === 'all' ? '全部文章' : categoryNames[selectedCategory] || selectedCategory) }}
            </h2>
            <div class="search-wrapper" v-if="selectedCategory !== '__trash__'">
              <el-input
                v-model="searchQuery"
                placeholder="搜索..."
                clearable
                size="default"
                style="width: 220px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
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
          <el-empty v-else-if="filteredBlogPosts.length === 0" :description="selectedCategory === '__trash__' ? '回收站是空的' : emptyText">
            <el-button v-if="selectedCategory !== '__trash__'" type="primary" @click="openUploadDialog">
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
              :class="{ 'trash-card': selectedCategory === '__trash__' }"
              @click="selectedCategory === '__trash__' ? null : showPostDetail(post)"
            >
              <div class="card-header">
                <div class="card-meta">
                  <template v-if="selectedCategory === '__trash__'">
                    <el-tag size="small" type="info">
                      <el-icon><Clock /></el-icon>
                      {{ formatDeletedDate(post.deletedAt) }}
                    </el-tag>
                  </template>
                  <template v-else>
                    <el-tag size="small" effect="plain" :type="getCategoryType(post.category)">
                      <el-icon><component :is="getCategoryIcon(post.category)" /></el-icon>
                      {{ post.category || '未分类' }}
                    </el-tag>
                    <span class="post-date">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDate(post.date) }}
                    </span>
                  </template>
                </div>
                <h3 class="post-title">{{ post.title }}</h3>
              </div>
              <p class="post-excerpt">{{ post.description }}</p>
              <div class="card-footer">
                <template v-if="selectedCategory === '__trash__'">
                  <el-button type="success" size="small" @click.stop="handleRestore(post.slug)">
                    <el-icon><RefreshRight /></el-icon>
                    恢复
                  </el-button>
                  <el-button type="danger" size="small" @click.stop="handlePermanentDelete(post.slug)">
                    <el-icon><Delete /></el-icon>
                    永久删除
                  </el-button>
                </template>
                <template v-else>
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
                </template>
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
        <template v-else-if="currentPost">
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
                  <div class="category-wrapper">
                    <el-select
                      v-if="isEditingCategory"
                      v-model="editCategory"
                      placeholder="选择或输入分类"
                      filterable
                      allow-create
                      default-first-option
                      clearable
                      size="small"
                      @change="handleCategoryChange"
                      @blur="cancelEditCategory"
                      ref="categorySelectRef"
                    >
                      <el-option
                        v-for="cat in allCategories"
                        :key="cat"
                        :label="cat || '未分类'"
                        :value="cat"
                      />
                    </el-select>
                    <span
                      v-else
                      class="post-category-display"
                      :class="{ 'is-editable': true }"
                      @click="startEditCategory"
                    >
                      {{ currentPost?.category || '未分类' }}
                      <span class="edit-hint">点击修改</span>
                    </span>
                  </div>
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
        <el-collapse>
          <el-collapse-item title="文章分类（可选）" name="category">
            <el-autocomplete
              v-model="uploadCategory"
              :fetch-suggestions="queryCategory"
              placeholder="输入文章分类"
              size="large"
              clearable
              class="category-input"
            >
              <template #prefix>
                <el-icon><Folder /></el-icon>
              </template>
            </el-autocomplete>
          </el-collapse-item>
        </el-collapse>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".md"
            @change="handleFileChange"
            @exceed="handleExceed"
            @remove="handleFileRemove"
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
          v-if="uploadFile && !uploading"
          @click="openPreview"
        >
          <el-icon><View /></el-icon>
          查看预览
        </el-button>
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

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFileName"
      width="800px"
      class="preview-dialog"
    >
      <div class="preview-dialog-content markdown-body" v-html="marked.parse(uploadPreview)"></div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
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
import { computed, ref, onMounted, watch, markRaw, nextTick } from 'vue';
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
  Clock,
  RefreshRight,
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
  UserFilled,
  Camera,
  Search
} from '@element-plus/icons-vue';

const configData = ref(null);
const blogPosts = ref([]);
const trashPosts = ref([]);
const selectedCategory = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const postsPerPage = 7;
const currentPost = ref(null);
const postContent = ref('');
const loading = ref(false);
const uploadDialogVisible = ref(false);
const isEditingCategory = ref(false);
const editCategory = ref('');
const allCategories = ref([]);
const categorySelectRef = ref(null);
const uploadFile = ref(null);
const uploading = ref(false);
const uploadCategory = ref('');
const uploadPreview = ref('');
const uploadRef = ref(null);
const previewDialogVisible = ref(false);
const previewFileName = ref('');
const isAdmin = ref(localStorage.getItem('isAdmin') === 'true');
const loginDialogVisible = ref(false);
const loginPassword = ref('');
const loginLoading = ref(false);

const avatarInputRef = ref(null);
const avatarUploading = ref(false);

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
    leetcode: 'primary',
    vue: 'success',
    algorithm: 'warning',
    frontend: 'info',
    backend: 'primary',
    database: 'danger',
    devops: 'warning',
    other: 'info'
  };
  return types[category] || 'info';
};

// 获取标签类型（根据标签名分配不同颜色）
const getTagType = (tag) => {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('array')) return 'info';
  if (tagLower.includes('linked')) return 'success';
  if (tagLower.includes('list')) return 'primary';
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
    const category = post.category || '未分类';
    if (map[category]) {
      map[category]++;
    } else {
      map[category] = 1;
    }
  });
  return map;
});

const filteredBlogPosts = computed(() => {
  let posts = [...blogPosts.value];

  // 回收站模式
  if (selectedCategory.value === '__trash__') {
    return [...trashPosts.value].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    posts = posts.filter(post => {
      const titleMatch = post.title?.toLowerCase().includes(query);
      const descMatch = post.description?.toLowerCase().includes(query);
      const tagMatch = post.tags?.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || descMatch || tagMatch;
    });
  }

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    posts = posts.filter(post => {
      const category = post.category || '未分类';
      return category === selectedCategory.value;
    });
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

watch(uploadDialogVisible, (val) => {
  if (!val) {
    uploadPreview.value = '';
    uploadFile.value = null;
    uploadRef.value?.clearFiles();
  }
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDeletedDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '今天删除';
  if (diffDays === 2) return '昨天删除';
  if (diffDays <= 7) return `${diffDays}天前删除`;
  return formatDate(dateString);
};

// 获取所有分类
const loadAllCategories = async () => {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    const categories = new Set();
    posts.forEach(post => {
      if (post.category) {
        categories.add(post.category);
      }
    });
    allCategories.value = Array.from(categories).sort();
  } catch (err) {
    console.error('获取分类失败:', err);
  }
};

const loadTrashPosts = async () => {
  try {
    const res = await fetch('/api/trash');
    trashPosts.value = await res.json();
  } catch (err) {
    console.error('获取回收站失败:', err);
  }
};

const startEditCategory = () => {
  editCategory.value = currentPost.value?.category || '';
  isEditingCategory.value = true;
  nextTick(() => {
    categorySelectRef.value?.focus();
  });
};

const handleCategoryChange = async (value) => {
  if (!currentPost.value) return;
  try {
    const res = await fetch(`/api/posts/${currentPost.value.slug}/category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: value })
    });

    if (!res.ok) {
      throw new Error('更新分类失败');
    }

    const result = await res.json();
    currentPost.value.category = result.category;
    isEditingCategory.value = false;
    ElMessage.success(result.message);
  } catch (err) {
    console.error('更新分类失败:', err);
    ElMessage.error('更新分类失败');
  }
};

const cancelEditCategory = () => {
  isEditingCategory.value = false;
  editCategory.value = '';
};

const showPostDetail = async (post) => {
  currentPost.value = post;
  loading.value = true;
  postContent.value = '';

  try {
    const response = await fetch(`/api/posts/${post.slug}`);

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

    const response = await fetch(`/api/posts/${currentPost.value.slug}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      ElMessage.success('文章已移至回收站');
      closePostDetail();
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        blogPosts.value = await postsRes.json();
      }
      loadTrashPosts();
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

const handleRestore = async (slug) => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复这篇文章吗？',
      '恢复文章',
      {
        confirmButtonText: '恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await fetch(`/api/trash/${slug}/restore`, {
      method: 'POST'
    });

    if (response.ok) {
      ElMessage.success('文章已恢复');
      // 重新加载列表
      const [postsRes, trashRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/trash')
      ]);
      blogPosts.value = await postsRes.json();
      trashPosts.value = await trashRes.json();
      loadAllCategories();
    } else {
      const result = await response.json();
      ElMessage.error(result.error || '恢复失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复失败:', error);
      ElMessage.error('恢复失败，请重试');
    }
  }
};

const handlePermanentDelete = async (slug) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除文章，确定吗？',
      '永久删除',
      {
        confirmButtonText: '永久删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    const response = await fetch(`/api/trash/${slug}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      ElMessage.success('文章已永久删除');
      trashPosts.value = trashPosts.value.filter(p => p.slug !== slug);
    } else {
      const result = await response.json();
      ElMessage.error(result.error || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('永久删除失败:', error);
      ElMessage.error('删除失败，请重试');
    }
  }
};

const openUploadDialog = () => {
  uploadCategory.value = '';
  uploadDialogVisible.value = true;
};

// 分类自动补全
const queryCategory = (queryString, callback) => {
  const allCategories = [...new Set(blogPosts.value.map(p => p.category).filter(c => c))];
  const filtered = queryString
    ? allCategories.filter(c => c.toLowerCase().includes(queryString.toLowerCase()))
    : allCategories;
  callback(filtered.map(c => ({ value: c })));
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

const handleFileChange = async (uploadFile_) => {
  uploadFile.value = uploadFile_.raw;
  // 读取文件内容用于预览
  const file = uploadFile_.raw;
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadPreview.value = e.target.result;
    };
    reader.readAsText(file);
  }
};

const handleExceed = () => {
  ElMessage.warning('最多只能上传 1 个文件');
};

const handleFileRemove = () => {
  uploadPreview.value = '';
  uploadFile.value = null;
};

const openPreview = () => {
  if (uploadPreview.value) {
    previewDialogVisible.value = true;
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
  if (uploadCategory.value) {
    formData.append('category', uploadCategory.value);
  }

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // 获取文件名作为 slug（去掉.md扩展名）
      const slug = uploadFile.value.name.replace('.md', '');

      // 关闭上传对话框
      uploadDialogVisible.value = false;
      uploading.value = false;

      // 显示 AI 处理中提示
      ElMessage.info({
        message: '文章已上传，AI 正在后台处理中...',
        duration: 3000
      });

      // 刷新分类
      loadAllCategories();

      // 轮询检查 AI 处理是否完成
      const pollForAIComplete = async () => {
        const maxAttempts = 30; // 最多等待 30 * 3 = 90 秒
        let attempts = 0;

        const checkPost = async () => {
          attempts++;
          try {
            const postsRes = await fetch('/api/posts');
            if (postsRes.ok) {
              const posts = await postsRes.json();
              const newPost = posts.find(p => p.slug === slug);

              if (newPost && newPost.tags && newPost.tags.length > 0) {
                // AI 处理完成，tags 已有内容
                blogPosts.value = posts;
                ElMessage.success({
                  message: 'AI 整理完成！',
                  duration: 2000
                });
                return true;
              }

              if (attempts >= maxAttempts) {
                // 超时，显示提示但仍更新列表
                ElMessage.warning({
                  message: 'AI 整理超时，文章已添加到列表',
                  duration: 3000
                });
                blogPosts.value = posts;
                return true;
              }

              // 继续轮询
              setTimeout(checkPost, 3000);
            }
          } catch (error) {
            console.error('检查 AI 处理状态失败:', error);
            if (attempts >= maxAttempts) {
              return true;
            }
            setTimeout(checkPost, 3000);
          }
          return false;
        };

        await checkPost();
      };

      // 启动轮询
      pollForAIComplete();
    } else {
      ElMessage.error(result.error || '上传失败');
      uploading.value = false;
    }
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error('上传失败，请重试');
    uploading.value = false;
  }
};

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click();
};

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片');
    return;
  }

  // 验证文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('头像图片不能超过 2MB');
    return;
  }

  avatarUploading.value = true;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('/api/avatar', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      ElMessage.success('头像更换成功');
      // 刷新配置数据以更新头像
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        configData.value = await configRes.json();
      }
    } else {
      ElMessage.error(result.error || '头像上传失败');
    }
  } catch (error) {
    console.error('头像上传失败:', error);
    ElMessage.error('头像上传失败，请重试');
  } finally {
    avatarUploading.value = false;
    // 清空 input 值，以便下次选择相同文件时能触发 change 事件
    event.target.value = '';
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

    loadAllCategories();
    loadTrashPosts();
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

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid rgba(255, 255, 255, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.avatar-wrapper:hover .avatar-upload-btn {
  opacity: 1;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
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
  margin-left: auto;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem 2rem;
  min-height: calc(100vh - 200px);
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
  font-size: 0.9rem;
  color: #1a1a2e;
  border-bottom: 1px solid #f0f0f5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-header .el-icon {
  font-size: 1.1rem;
}

.category-list {
  padding: 0.75rem;
}

.category-section-title {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #5a5a72;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;
}

.category-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
}

.category-item:hover::before {
  opacity: 1;
}

.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.category-item.active::before {
  opacity: 0;
}

.category-item .el-icon {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.category-item:hover .el-icon {
  transform: scale(1.1);
}

.category-item .category-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-item .el-tag {
  font-size: 0.7rem;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
}

.trash-section {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #e8e8e8;
}

.trash-icon-wrapper {
  position: relative;
}

.trash-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #f56c6c;
  color: white;
  font-size: 0.65rem;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: 600;
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
  flex-wrap: wrap;
  gap: 0.5rem;
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

.search-wrapper {
  display: inline-flex;
}

.search-wrapper :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.search-wrapper :deep(.el-input__wrapper:hover),
.search-wrapper :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
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

.blog-post-card.trash-card {
  cursor: default;
}

.blog-post-card.trash-card:hover {
  transform: none;
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

/* 到底了 */
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

.post-category-display {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.post-category-display.is-editable:hover {
  background: rgba(255, 255, 255, 0.35);
}

.edit-hint {
  font-size: 0.7rem;
  opacity: 0.7;
}

.category-wrapper {
  display: inline-flex;
  align-items: center;
}

.category-wrapper :deep(.el-select) {
  width: 130px;
}

.category-wrapper :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.category-wrapper :deep(.el-input__inner) {
  color: white;
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

.upload-form :deep(.el-collapse) {
  border: none;
  margin-bottom: 1rem;
}

.upload-form :deep(.el-collapse-item__header) {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0 1rem;
  font-weight: 500;
  color: #606266;
}

.upload-form :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.upload-form :deep(.el-collapse-item__content) {
  padding: 1rem 0;
}

.upload-form :deep(.el-collapse-item__arrow) {
  color: #606266;
}

.category-input {
  width: 100%;
}

.category-input :deep(.el-input__wrapper) {
  border-radius: 10px;
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

/* 预览对话框 */
.preview-dialog {
  margin-top: 2vh;
}

.preview-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 1.5rem;
  background: #fff;
  font-size: 1rem;
  line-height: 1.8;
  color: #4a4a68;
}

.preview-dialog-content :deep(h1) {
  font-size: 1.75rem;
  margin: 0 0 1.25rem;
  color: #1a1a2e;
  font-weight: 600;
}

.preview-dialog-content :deep(h2) {
  font-size: 1.4rem;
  margin: 1.5rem 0 1rem;
  color: #1a1a2e;
  font-weight: 600;
}

.preview-dialog-content :deep(h3) {
  font-size: 1.2rem;
  margin: 1.25rem 0 0.75rem;
  color: #1a1a2e;
  font-weight: 600;
}

.preview-dialog-content :deep(p) {
  margin: 1rem 0;
}

.preview-dialog-content :deep(code) {
  background: #f4f3ec;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.95em;
  color: #aa3bff;
}

.preview-dialog-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.25rem;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1.25rem 0;
}

.preview-dialog-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.9rem;
}

.preview-dialog-content :deep(blockquote) {
  margin: 1.25rem 0;
  padding: 0.75rem 1.25rem;
  border-left: 4px solid #667eea;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0 8px 8px 0;
  color: #606266;
  font-style: italic;
}

.preview-dialog-content :deep(ul),
.preview-dialog-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.preview-dialog-content :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.7;
}

.preview-dialog-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-dialog-content :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 2rem 0;
  border-radius: 1px;
}

.preview-dialog-content :deep(a) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.preview-dialog-content :deep(a:hover) {
  border-bottom-color: #667eea;
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

  .login-btn,
  .visitor-btn,
  .logout-btn,
  .upload-btn {
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

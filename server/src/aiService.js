import axios from 'axios';
import 'dotenv/config';

const MINIMAX_API_URL = 'https://api.minimaxi.com/anthropic/v1/messages';
const MODEL = 'MiniMax-M2.7';

class ApiKeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

/**
 * 调用 MiniMax API 分析文章
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @param {string} currentCategory - 当前分类
 * @returns {Promise<{tags: string[], suggestedCategory: string}>}
 */
async function analyzePost(title, content, currentCategory) {
  const prompt = `你是一个博客文章分析助手。请分析以下文章内容，提取：
1. 标签（tags）：3-5个关键词标签
2. 建议分类（suggestedCategory）：最适合的分类名称（可以是新的分类或者已有的：${currentCategory}）

文章标题：${title}
文章内容：${content.slice(0, 2000)}

请以JSON格式返回：
{
  "tags": ["标签1", "标签2", "标签3"],
  "suggestedCategory": "分类名称"
}

注意：
- 标签使用英文，便于搜索和过滤
- 分类名称使用英文小写
- 只返回JSON，不要有其他文字`;

  try {
    const response = await axios.post(
      MINIMAX_API_URL,
      {
        model: MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
          'Content-Type': 'application/json',
          'x-api-id': 'cli'
        },
        timeout: 60000
      }
    );

    console.log('API 完整响应:', JSON.stringify(response.data, null, 2));

    // 解析 Anthropic 格式响应
    let resultText;
    if (response.data.content && Array.isArray(response.data.content)) {
      const textBlock = response.data.content.find(block => block.type === 'text');
      if (textBlock && textBlock.text) {
        resultText = textBlock.text;
      }
    }

    if (!resultText) {
      throw new Error('无法从响应中提取文本: ' + JSON.stringify(response.data));
    }

    // 解析 JSON 响应
    const jsonMatch = resultText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        suggestedCategory: parsed.suggestedCategory || currentCategory
      };
    }

    throw new Error('无法解析 AI 返回结果');
  } catch (error) {
    console.error('AI 分析失败:', error.message);
    if (error.response) {
      console.error('API 错误:', error.response.status, error.response.data);
      // API-key 无效或过期 (401) 或权限不足 (403)
      if (error.response.status === 401 || error.response.status === 403) {
        throw new ApiKeyError('API-key 无效或已过期，请检查配置');
      }
    }
    // 检查是否是没有配置 API-key
    if (!process.env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY === 'your_api_key_here') {
      throw new ApiKeyError('API-key 未正确配置，请参照 README 文档配置 MiniMax API-key');
    }
    throw error;
  }
}

/**
 * 批量分析所有文章
 * @param {Array} posts - 文章索引列表
 * @param {Function} getPostContent - 获取文章内容的函数
 * @returns {Promise<Array>} - 分析结果列表
 */
async function batchAnalyze(posts, getPostContent) {
  const results = [];

  for (const post of posts) {
    try {
      console.log(`正在分析: ${post.title}...`);
      const content = await getPostContent(post.category, post.slug);
      const analysis = await analyzePost(post.title, content, post.category);
      results.push({
        slug: post.slug,
        category: post.category,
        ...analysis,
        success: true
      });

      // 添加延迟避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`分析失败 [${post.slug}]:`, error.message);
      results.push({
        slug: post.slug,
        category: post.category,
        tags: post.tags,
        suggestedCategory: post.category,
        success: false,
        error: error.message,
        isApiKeyError: error instanceof ApiKeyError
      });
    }
  }

  return results;
}

export { analyzePost, batchAnalyze, ApiKeyError };

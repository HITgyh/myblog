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
 * @returns {Promise<{tags: string[]}>}
 */
async function analyzePost(title, content) {
  const prompt = `你是一个博客文章分析助手。请分析以下文章内容，提取：
1. 标签（tags）：3-5个关键词标签，使用英文
2. 描述（description）：20-50字的中文文章简介，用于展示在文章列表中

文章标题：${title}
文章内容：${content.slice(0, 2000)}

请以JSON格式返回：
{
  "tags": ["Tag1", "Tag2", "Tag3"],
  "description": "这是文章的中文简介..."
}

注意：
- 只返回JSON，不要有其他文字`;

  try {
    const response = await axios.post(
      MINIMAX_API_URL,
      {
        model: MODEL,
        max_tokens: 3000,
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
      // 优先查找 text 类型
      const textBlock = response.data.content.find(block => block.type === 'text');
      if (textBlock && textBlock.text) {
        resultText = textBlock.text;
      } else {
        // 如果没有 text 类型，尝试从 thinking 类型提取
        const thinkingBlock = response.data.content.find(block => block.type === 'thinking');
        if (thinkingBlock && thinkingBlock.thinking) {
          resultText = thinkingBlock.thinking;
        }
      }
    }

    if (!resultText) {
      throw new Error('无法从响应中提取文本: ' + JSON.stringify(response.data));
    }

    // 尝试从 resultText 中解析 JSON
    const jsonMatch = resultText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          description: typeof parsed.description === 'string' ? parsed.description : ''
        };
      } catch (e) {
        // JSON 解析失败，尝试从 thinking 内容中提取
      }
    }

    // 从 thinking 内容中直接提取 description
    // 尝试 "description": "xxx" 格式
    const descMatch = resultText.match(/"description":\s*"([^"]+)"/);
    if (descMatch) {
      return {
        tags: [],
        description: descMatch[1]
      };
    }

    // 尝试 Our description: "xxx" 格式
    const ourDescMatch = resultText.match(/Our description:\s*"([^"]+)"/);
    if (ourDescMatch) {
      return {
        tags: [],
        description: ourDescMatch[1]
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

export { analyzePost, ApiKeyError };

// myblog/server/src/providers/baseProvider.js

/**
 * 所有 AI Provider 的基类
 */
export class BaseProvider {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - API 密钥
   * @param {string} config.baseURL - API 基础地址
   * @param {string} config.model - 模型名称
   * @param {Object} [config.extraHeaders] - 额外的请求头
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new ApiKeyError(`API-key 未配置`);
    }
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL.replace(/\/+$/, '');
    this.model = config.model;
    this.extraHeaders = config.extraHeaders || {};
  }

  /**
   * 分析文章，子类必须实现
   * @param {string} title
   * @param {string} content
   * @returns {Promise<{tags: string[], description: string}>}
   */
  async analyzePost(title, content) {
    throw new Error('子类必须实现 analyzePost 方法');
  }

  /**
   * 构建统一的 prompt
   * @param {string} title
   * @param {string} content
   * @returns {string}
   */
  buildPrompt(title, content) {
    return `你是一个博客文章分析助手。请分析以下文章内容，提取：
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
  }

  /**
   * 从 AI 响应文本中解析 JSON
   * @param {string} text
   * @returns {{tags: string[], description: string}}
   */
  parseResponse(text) {
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          description: typeof parsed.description === 'string' ? parsed.description : ''
        };
      } catch (e) {
        // JSON 解析失败，继续尝试其他方式
      }
    }

    // 尝试从 "description": "xxx" 格式提取
    const descMatch = text.match(/"description":\s*"([^"]+)"/);
    if (descMatch) {
      return { tags: [], description: descMatch[1] };
    }

    throw new Error('无法解析 AI 返回结果');
  }
}

export class ApiKeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

// myblog/server/src/providers/openaiCompatibleProvider.js
import axios from 'axios';
import { BaseProvider } from './baseProvider.js';

/**
 * OpenAI 兼容 API 的 Provider
 * 覆盖：OpenAI / DeepSeek / GLM / Kimi / 通义千问 / MiniMax(OpenAI 模式)
 */
export class OpenAICompatibleProvider extends BaseProvider {
  async analyzePost(title, content) {
    const prompt = this.buildPrompt(title, content);

    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: '你是一个专业的博客文章分析助手。' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...this.extraHeaders
        },
        timeout: 60000
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('API 响应为空或格式异常: ' + JSON.stringify(response.data));
    }

    return this.parseResponse(text);
  }
}

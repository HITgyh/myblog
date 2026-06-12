// myblog/server/src/providers/anthropicProvider.js
import axios from 'axios';
import { BaseProvider } from './baseProvider.js';

/**
 * Anthropic Messages API 的 Provider
 * 覆盖：Claude（标准 Anthropic API）、MiniMax（Anthropic 兼容模式）
 *
 * 鉴权方式：
 * - Claude: x-api-key header
 * - MiniMax: Authorization: Bearer header + x-api-id: cli
 *
 * MiniMax 通过 factory 的 extraHeaders 传入 Authorization 覆盖默认鉴权
 */
export class AnthropicProvider extends BaseProvider {
  async analyzePost(title, content) {
    const prompt = this.buildPrompt(title, content);

    // 默认 Anthropic API 使用 x-api-key
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      ...this.extraHeaders
    };

    // 如果 extraHeaders 中传入了 Authorization，移除 x-api-key（避免冲突）
    if (this.extraHeaders && this.extraHeaders['Authorization']) {
      delete headers['x-api-key'];
    }

    const response = await axios.post(
      `${this.baseURL}/messages`,
      {
        model: this.model,
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt }
            ]
          }
        ]
      },
      { headers, timeout: 60000 }
    );

    // 从 Anthropic 响应格式中提取文本
    let resultText;
    if (response.data.content && Array.isArray(response.data.content)) {
      const textBlock = response.data.content.find(block => block.type === 'text');
      if (textBlock && textBlock.text) {
        resultText = textBlock.text;
      }
    }

    if (!resultText) {
      throw new Error('无法从 Anthropic 响应中提取文本: ' + JSON.stringify(response.data));
    }

    return this.parseResponse(resultText);
  }
}

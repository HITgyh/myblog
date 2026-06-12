// myblog/server/src/providers/factory.js
import { OpenAICompatibleProvider } from './openaiCompatibleProvider.js';
import { AnthropicProvider } from './anthropicProvider.js';

/**
 * 供应商配置表
 * 每个供应商定义：
 * - class: 使用的 Provider 类
 * - envKey: API Key 的环境变量名
 * - defaultBaseURL: 默认 API 地址
 * - defaultModel: 默认模型
 * - extraHeaders: (可选) 额外的请求头
 */
const PROVIDER_CONFIGS = {
  openai: {
    class: OpenAICompatibleProvider,
    envKey: 'OPENAI_API_KEY',
    defaultBaseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    class: OpenAICompatibleProvider,
    envKey: 'DEEPSEEK_API_KEY',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  glm: {
    class: OpenAICompatibleProvider,
    envKey: 'GLM_API_KEY',
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
  },
  kimi: {
    class: OpenAICompatibleProvider,
    envKey: 'KIMI_API_KEY',
    defaultBaseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  qwen: {
    class: OpenAICompatibleProvider,
    envKey: 'QWEN_API_KEY',
    defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
  },
  minimax: {
    class: AnthropicProvider,
    envKey: 'MINIMAX_API_KEY',
    defaultBaseURL: 'https://api.minimaxi.com/anthropic/v1',
    defaultModel: 'MiniMax-M2.7',
    // MiniMax Anthropic 模式使用 x-api-id header
    extraHeaders: {
      'x-api-id': 'cli'
    },
  },
  claude: {
    class: AnthropicProvider,
    envKey: 'CLAUDE_API_KEY',
    defaultBaseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
  },
};

/**
 * 根据供应商名称创建对应的 Provider 实例
 * @param {string} providerName - 供应商名称（小写）
 * @returns {BaseProvider}
 */
export function createProvider(providerName) {
  const config = PROVIDER_CONFIGS[providerName];
  if (!config) {
    throw new Error(
      `不支持的 AI 供应商: "${providerName}"。可选: ${Object.keys(PROVIDER_CONFIGS).join(', ')}`
    );
  }

  const apiKey = process.env[config.envKey];
  const baseURL = process.env[`${config.envKey.replace('_API_KEY', '_BASE_URL')}`] || config.defaultBaseURL;
  const model = process.env[`${config.envKey.replace('_API_KEY', '_MODEL')}`] || config.defaultModel;

  // MiniMax 特殊处理：使用 Authorization header 鉴权（AnthropicProvider 默认用 x-api-key）
  let extraHeaders = config.extraHeaders;
  if (providerName === 'minimax') {
    extraHeaders = {
      ...(extraHeaders || {}),
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  return new config.class({
    apiKey,
    baseURL,
    model,
    extraHeaders,
  });
}

/**
 * 获取所有可用的供应商列表
 * @returns {string[]}
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDER_CONFIGS);
}

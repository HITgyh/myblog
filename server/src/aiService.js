// myblog/server/src/aiService.js
import 'dotenv/config';
import { createProvider, getAvailableProviders } from './providers/factory.js';
import { ApiKeyError } from './providers/baseProvider.js';

const providerName = (process.env.AI_PROVIDER || 'minimax').toLowerCase();

// 启动时检查供应商是否支持
const availableProviders = getAvailableProviders();
if (!availableProviders.includes(providerName)) {
  console.error(`❌ 不支持的 AI 供应商: "${providerName}"`);
  console.error(`   可选: ${availableProviders.join(', ')}`);
  console.error('   请检查 .env 文件中的 AI_PROVIDER 配置');
  process.exit(1);
}

console.log(`🤖 AI 供应商: ${providerName}`);
const provider = createProvider(providerName);

/**
 * 调用 AI 分析文章
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @returns {Promise<{tags: string[], description: string}>}
 */
export async function analyzePost(title, content) {
  try {
    return await provider.analyzePost(title, content);
  } catch (error) {
    console.error(`AI 分析失败 (${providerName}):`, error.message);

    // 封装 API Key 相关错误
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        throw new ApiKeyError(`${providerName} 的 API-key 无效或已过期，请检查配置`);
      }
    }

    if (error instanceof ApiKeyError) {
      throw error;
    }

    throw error;
  }
}

export { ApiKeyError };

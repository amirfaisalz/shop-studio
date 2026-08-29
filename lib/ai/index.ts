import 'server-only';
import type { AIProvider } from './types';
import { createGeminiProvider } from './providers/gemini';
import { createOpenAICompatibleProvider } from './providers/openai-compatible';
import { AIClientConfig, AIProviderId, getDefaultModelForProvider } from './models';

/**
 * AI provider factory. Resolves the requested or configured provider & model
 * (AGENTS.md §7) so the app remains provider-independent.
 *
 * Supports client-level model switching (DeepSeek, OpenRouter, OpenAI, Gemini, Custom)
 * as well as server environment variables (AI_PROVIDER, AI_MODEL, DEEPSEEK_API_KEY,
 * OPENROUTER_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY).
 */
export function getAIProvider(config?: AIClientConfig): AIProvider {
  const provider = ((config?.provider ?? process.env.AI_PROVIDER ?? 'gemini') as string).toLowerCase() as AIProviderId;
  const model = config?.model || process.env.AI_MODEL || getDefaultModelForProvider(provider);

  switch (provider) {
    case 'gemini': {
      const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
      return createGeminiProvider(model, apiKey);
    }

    case 'deepseek': {
      const apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY || '';
      const baseUrl = config?.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
      return createOpenAICompatibleProvider({
        providerName: 'DeepSeek',
        baseUrl,
        apiKey,
        model: model || 'deepseek-chat',
      });
    }

    case 'openrouter': {
      const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || '';
      const baseUrl = config?.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      return createOpenAICompatibleProvider({
        providerName: 'OpenRouter',
        baseUrl,
        apiKey,
        model: model || 'deepseek/deepseek-chat',
      });
    }

    case 'openai': {
      const apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';
      const baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      return createOpenAICompatibleProvider({
        providerName: 'OpenAI',
        baseUrl,
        apiKey,
        model: model || 'gpt-4o-mini',
      });
    }

    case 'custom': {
      const apiKey = config?.apiKey || process.env.CUSTOM_AI_API_KEY || 'not-needed';
      const baseUrl = config?.baseUrl || process.env.CUSTOM_AI_BASE_URL || 'http://localhost:11434/v1';
      return createOpenAICompatibleProvider({
        providerName: 'Custom AI',
        baseUrl,
        apiKey,
        model: model || 'llama3',
      });
    }

    default:
      throw new Error(`Unsupported AI provider "${provider}". Please choose Gemini, DeepSeek, OpenRouter, OpenAI, or Custom.`);
  }
}

export type { AIProvider } from './types';
export * from './models';

export type AIProviderId = 'gemini' | 'deepseek' | 'openrouter' | 'openai' | 'custom';

export interface AIModelDefinition {
  id: string;
  name: string;
  provider: AIProviderId;
  description: string;
  badge?: string;
  recommended?: boolean;
  contextWindow?: string;
}

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  description: string;
  defaultBaseUrl?: string;
  defaultModel: string;
  apiKeyEnvVar: string;
  docUrl?: string;
}

export interface AIClientConfig {
  provider?: AIProviderId;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export const AI_PROVIDERS: Record<AIProviderId, AIProviderInfo> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Fast, multimodal models directly from Google AI.',
    defaultModel: 'gemini-2.5-flash',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    docUrl: 'https://aistudio.google.com/apikey',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'High-intelligence reasoning and coding models with exceptional cost-efficiency.',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    docUrl: 'https://platform.deepseek.com/api_keys',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified gateway offering DeepSeek, Claude, Llama, OpenAI, and hundreds of top models.',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-chat',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    docUrl: 'https://openrouter.ai/keys',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Industry-standard flagship models including GPT-4o and o3-mini.',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    docUrl: 'https://platform.openai.com/api-keys',
  },
  custom: {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    description: 'Any OpenAI-compatible server (Groq, Ollama, LM Studio, vLLM, etc.).',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    apiKeyEnvVar: 'CUSTOM_AI_API_KEY',
  },
};

export const AI_MODELS: AIModelDefinition[] = [
  // DeepSeek
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    description: 'High-capability flagship model for design, code, and structured Shopify layouts.',
    badge: 'Popular',
    recommended: true,
    contextWindow: '64k',
  },
  {
    id: 'DeepSeek-V4-Flash-0731',
    name: 'DeepSeek-V4-Flash-0731',
    provider: 'deepseek',
    description: 'High-speed DeepSeek V4 Flash model for rapid storefront generation and responsive layouts.',
    badge: 'Fast',
    contextWindow: '128k',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    description: 'Advanced reasoning model with deep chain-of-thought for complex architecture.',
    badge: 'Reasoning',
    contextWindow: '64k',
  },

  // OpenRouter
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (OpenRouter)',
    provider: 'openrouter',
    description: 'DeepSeek V3 hosted via OpenRouter with ultra-low latency.',
    badge: 'Fast',
    recommended: true,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (OpenRouter)',
    provider: 'openrouter',
    description: 'DeepSeek R1 reasoning model routed through OpenRouter.',
    badge: 'Reasoning',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: 'Leading benchmark in frontend design, HTML/Tailwind styling, and Liquid schema.',
    badge: 'Top Design',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (OpenRouter)',
    provider: 'openrouter',
    description: 'OpenAI flagship model through OpenRouter gateway.',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (OpenRouter)',
    provider: 'openrouter',
    description: 'Ultra-fast and economical for rapid storefront prototyping.',
    badge: 'Lightweight',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B (OpenRouter)',
    provider: 'openrouter',
    description: 'Open-weights flagship model with great code generation capabilities.',
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder (OpenRouter)',
    provider: 'openrouter',
    description: 'Specialized coding model tailored for web layouts and templates.',
  },

  // Google Gemini
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Latest next-gen multimodal speed & reasoning model from Google.',
    badge: 'Default',
    recommended: true,
    contextWindow: '1M',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'Fast, responsive, and robust generation.',
    contextWindow: '1M',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Deep context reasoning for large multi-section theme blueprints.',
    badge: 'High Context',
    contextWindow: '2M',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'High-throughput and lightweight model.',
    contextWindow: '1M',
  },

  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI flagship intelligent model with strong web design aesthetics.',
    badge: 'Flagship',
    recommended: true,
    contextWindow: '128k',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast, lightweight and cost-efficient for quick edits.',
    badge: 'Fast',
    contextWindow: '128k',
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    description: 'OpenAI reasoning model for precision engineering.',
    badge: 'Reasoning',
    contextWindow: '200k',
  },
];

export const DEFAULT_AI_CONFIG: Required<AIClientConfig> = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: '',
  baseUrl: '',
};

export function getModelsForProvider(provider: AIProviderId): AIModelDefinition[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export function findModelDefinition(modelId: string): AIModelDefinition | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

export function getDefaultModelForProvider(provider: AIProviderId): string {
  return AI_PROVIDERS[provider]?.defaultModel ?? 'gemini-2.5-flash';
}

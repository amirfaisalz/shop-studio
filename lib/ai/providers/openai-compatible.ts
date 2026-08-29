import 'server-only';
import type {
  AIProvider,
  PlanTurnInput,
  StreamPageInput,
  EditPageInput,
  GenerateThemeInput,
  ShopifySectionInput,
} from '../types';
import {
  turnPlanSchema,
  pagePatchSchema,
  themeSpecSchema,
  shopifySectionSpecSchema,
  type TurnPlan,
  type PagePatch,
  type ThemeSpec,
  type ShopifySectionSpec,
} from '../schema';
import {
  planTurnSystemPrompt,
  streamPageSystemPrompt,
  editPageSystemPrompt,
  themeSystemPrompt,
  shopifySectionSystemPrompt,
} from '../prompts';

interface OpenAICompatibleOptions {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  defaultHeaders?: Record<string, string>;
}

interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  );
}

export function formatOpenAIErrorMessage(err: unknown, providerName: string): string {
  if (!err) return 'Generation failed.';
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  let cleanMsg = msg;
  try {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        cleanMsg = parsed.error.message;
      }
    }
  } catch {
    // fallback
  }

  if (lower.includes('401') || lower.includes('invalid_api_key') || lower.includes('authentication')) {
    return `Invalid or missing API key for ${providerName}. Please check your API key in settings or environment variables.`;
  }
  if (lower.includes('429') || lower.includes('insufficient_quota') || lower.includes('rate limit')) {
    return `${providerName} rate limit reached or quota exceeded. Please check your credit balance or try again in a moment.`;
  }
  if (lower.includes('503') || lower.includes('502') || lower.includes('504')) {
    return `${providerName} servers are temporarily overloaded. Please retry in a moment.`;
  }

  return cleanMsg;
}

function extractJson(text: string): unknown {
  const clean = text.trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Try matching markdown code fences ```json ... ``` or ``` ... ```
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // continue
      }
    }

    // Try finding first { and last }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
      } catch {
        // continue
      }
    }

    throw new Error('The model did not return a valid JSON object.');
  }
}

export function createOpenAICompatibleProvider(options: OpenAICompatibleOptions): AIProvider {
  const { providerName, baseUrl, apiKey, model, defaultHeaders } = options;

  if (!apiKey) {
    throw new Error(`API key is required for ${providerName}. Please provide one in settings or set in .env.local.`);
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    ...defaultHeaders,
  };

  if (providerName.toLowerCase() === 'openrouter') {
    headers['HTTP-Referer'] = 'https://shopstudio.app';
    headers['X-Title'] = 'ShopStudio AI Shopify Builder';
  }

  async function executeCompletion(
    messages: ChatMessageParam[],
    jsonMode = false,
    temperature = 0.7,
    abortSignal?: AbortSignal,
    maxRetries = 1
  ): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }

      try {
        const body: Record<string, unknown> = {
          model,
          messages,
          temperature,
        };

        if (jsonMode) {
          // Avoid setting response_format for reasoner models that forbid it
          if (!model.includes('reasoner') && !model.includes('r1')) {
            body.response_format = { type: 'json_object' };
          }
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: abortSignal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`[${providerName} ${res.status}] ${errText || res.statusText}`);
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const content = data.choices?.[0]?.message?.content ?? '';
        return content;
      } catch (err) {
        if (abortSignal?.aborted) throw err;

        if (!isTransientError(err) || attempt === maxRetries) {
          throw new Error(formatOpenAIErrorMessage(err, providerName));
        }

        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 400, 4000);
        console.warn(`[${providerName}] Transient error (attempt ${attempt + 1}/${maxRetries + 1}): ${err}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`${providerName} request failed.`);
  }

  async function* streamCompletion(
    messages: ChatMessageParam[],
    temperature = 0.8,
    abortSignal?: AbortSignal,
    maxRetries = 1
  ): AsyncIterable<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (abortSignal?.aborted) return;

      let yieldedAny = false;
      try {
        const body = {
          model,
          messages,
          temperature,
          stream: true,
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: abortSignal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`[${providerName} ${res.status}] ${errText || res.statusText}`);
        }

        if (!res.body) {
          throw new Error(`No response stream from ${providerName}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          if (abortSignal?.aborted) return;
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                yieldedAny = true;
                yield text;
              }
            } catch {
              // Ignore partial or unparseable SSE chunks
            }
          }
        }
        return;
      } catch (err) {
        if (abortSignal?.aborted) return;
        if (yieldedAny) {
          throw new Error(formatOpenAIErrorMessage(err, providerName));
        }
        if (!isTransientError(err) || attempt === maxRetries) {
          throw new Error(formatOpenAIErrorMessage(err, providerName));
        }

        const delay = Math.min(1200 * Math.pow(2, attempt) + Math.random() * 500, 5000);
        console.warn(`[${providerName} stream] Transient error: ${err}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    async planTurn(input: PlanTurnInput): Promise<TurnPlan> {
      const messages: ChatMessageParam[] = [
        { role: 'system', content: planTurnSystemPrompt(input.existingPages, input.activePageId) },
        ...input.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const raw = await executeCompletion(messages, true, 0.7, input.abortSignal);
      let parsed: unknown;
      try {
        parsed = extractJson(raw);
      } catch {
        return { reply: raw.trim() || 'Sorry, could you rephrase that?', action: 'chat', plannedPages: [] };
      }

      const result = turnPlanSchema.safeParse(parsed);
      if (!result.success) {
        return { reply: 'Sorry, I had trouble planning that. Could you rephrase?', action: 'chat', plannedPages: [] };
      }
      return result.data;
    },

    async generateTheme(input: GenerateThemeInput): Promise<ThemeSpec> {
      const messages: ChatMessageParam[] = [
        { role: 'system', content: themeSystemPrompt() },
        ...input.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const raw = await executeCompletion(messages, true, 0.7, input.abortSignal);
      let parsed: unknown;
      try {
        parsed = extractJson(raw);
      } catch {
        throw new Error('The model returned an invalid theme format.');
      }

      const result = themeSpecSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error('The model returned an invalid theme schema.');
      }
      return result.data;
    },

    async *streamPage(input: StreamPageInput): AsyncIterable<string> {
      const messages: ChatMessageParam[] = [
        { role: 'system', content: streamPageSystemPrompt(input.page, input.siblingPages, input.styleGuide) },
        ...input.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      yield* streamCompletion(messages, 0.8, input.abortSignal);
    },

    async editPage(input: EditPageInput): Promise<PagePatch> {
      const messages: ChatMessageParam[] = [
        { role: 'system', content: editPageSystemPrompt(input.page, input.html, input.styleGuide) },
        ...input.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const raw = await executeCompletion(messages, true, 0.4, input.abortSignal);
      let parsed: unknown;
      try {
        parsed = extractJson(raw);
      } catch {
        return { operations: [] as PagePatch['operations'] };
      }

      const result = pagePatchSchema.safeParse(parsed);
      if (!result.success) {
        return { operations: [] as PagePatch['operations'] };
      }
      return result.data;
    },

    async generateShopifySection(input: ShopifySectionInput): Promise<ShopifySectionSpec> {
      const messages: ChatMessageParam[] = [
        {
          role: 'system',
          content: shopifySectionSystemPrompt({
            brandName: input.brandName,
            pageType: input.pageType,
            pageLabel: input.pageLabel,
            role: input.role,
            styleGuide: input.styleGuide,
          }),
        },
        { role: 'user', content: input.html },
      ];

      const raw = await executeCompletion(messages, true, 0.4, input.abortSignal);
      let parsed: unknown;
      try {
        parsed = extractJson(raw);
      } catch {
        throw new Error('The model returned an invalid Shopify section format.');
      }

      const result = shopifySectionSpecSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error('The model returned an invalid Shopify section schema.');
      }
      return result.data;
    },
  };
}

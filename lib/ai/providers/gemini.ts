import 'server-only';
import { GoogleGenAI } from '@google/genai';
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

/**
 * Gemini adapter. All Gemini-specific request shaping lives here so the rest of
 * the app depends only on the `AIProvider` interface. The API key and model id
 * are read from the environment and never leave the server.
 */

type Turn = { role: 'user' | 'assistant'; content: string };

/** Map our chat turns to Gemini's `contents` (assistant -> "model"). */
function toContents(messages: Turn[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/** Check if an error is transient (e.g. 503 high demand, 429 rate limit, 500, network error) */
function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
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

/** User-friendly error message cleanup */
export function formatAIErrorMessage(err: unknown): string {
  if (!err) return 'Generation failed.';
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  // Extract nested JSON error message if present (e.g. from Google API response)
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

  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
    return 'The AI model is currently experiencing high demand from Google. Please click "Retry Generation" or try again in a moment.';
  }
  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('rate limit')) {
    return 'AI request rate limit reached. Please wait a moment before trying again.';
  }
  if (lower.includes('api_key') || lower.includes('unauthorized') || lower.includes('401') || lower.includes('403')) {
    return 'Invalid or missing GEMINI_API_KEY. Please verify your API key in .env.local.';
  }

  return cleanMsg;
}

const FALLBACK_MODELS: Record<string, string[]> = {
  'gemini-3.6-flash': ['gemini-3.7-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  'gemini-3.7-flash': ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  'gemini-3.5-flash': ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
  'gemini-2.0-flash': ['gemini-1.5-flash', 'gemini-3.6-flash'],
  'gemini-1.5-flash': ['gemini-2.0-flash', 'gemini-3.6-flash'],
};

async function executeWithRetry<T>(
  primaryModel: string,
  fn: (modelToUse: string) => Promise<T>,
  abortSignal?: AbortSignal,
  maxRetriesPerModel = 1
): Promise<T> {
  const modelsToTry = [primaryModel, ...(FALLBACK_MODELS[primaryModel] ?? [])];
  let lastError: unknown = null;

  for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
    const currentModel = modelsToTry[mIndex];

    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      if (abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }

      try {
        return await fn(currentModel);
      } catch (err) {
        lastError = err;

        if (abortSignal?.aborted) {
          throw err;
        }

        if (!isTransientError(err)) {
          throw new Error(formatAIErrorMessage(err));
        }

        if (attempt < maxRetriesPerModel) {
          const delay = Math.min(800 * Math.pow(2, attempt) + Math.random() * 400, 3000);
          console.warn(
            `[gemini] Transient error on ${currentModel} (attempt ${attempt + 1}/${maxRetriesPerModel + 1}): ${
              err instanceof Error ? err.message : String(err)
            }. Retrying in ${Math.round(delay)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (mIndex < modelsToTry.length - 1) {
      console.warn(
        `[gemini] Model ${currentModel} hit high demand. Switching to fallback ${modelsToTry[mIndex + 1]}...`
      );
    }
  }

  throw new Error(formatAIErrorMessage(lastError));
}

async function* streamWithRetry(
  primaryModel: string,
  createStreamFn: (modelToUse: string) => Promise<AsyncIterable<{ text?: string }>>,
  abortSignal?: AbortSignal,
  maxRetriesPerModel = 1
): AsyncIterable<string> {
  const modelsToTry = [primaryModel, ...(FALLBACK_MODELS[primaryModel] ?? [])];
  let lastError: unknown = null;

  for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
    const currentModel = modelsToTry[mIndex];

    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      if (abortSignal?.aborted) return;

      let yieldedAny = false;
      try {
        const stream = await createStreamFn(currentModel);
        for await (const chunk of stream) {
          if (abortSignal?.aborted) return;
          const text = chunk.text;
          if (text) {
            yieldedAny = true;
            yield text;
          }
        }
        return;
      } catch (err) {
        lastError = err;
        if (abortSignal?.aborted) return;

        // If we already sent chunks to the client, fail cleanly so the user can click Retry Generation
        if (yieldedAny) {
          throw new Error(formatAIErrorMessage(err));
        }

        if (!isTransientError(err)) {
          throw new Error(formatAIErrorMessage(err));
        }

        if (attempt < maxRetriesPerModel) {
          const delay = Math.min(1200 * Math.pow(2, attempt) + Math.random() * 500, 5000);
          console.warn(
            `[gemini stream] Transient error on ${currentModel} (attempt ${attempt + 1}/${maxRetriesPerModel + 1}): ${
              err instanceof Error ? err.message : String(err)
            }. Retrying in ${Math.round(delay)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw new Error(formatAIErrorMessage(lastError));
}

export function createGeminiProvider(model: string, customApiKey?: string): AIProvider {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please provide one in settings or add GEMINI_API_KEY to .env.local.');
  }
  const ai = new GoogleGenAI({ apiKey });

  return {
    async planTurn(input: PlanTurnInput): Promise<TurnPlan> {
      return executeWithRetry(
        model,
        async (activeModel) => {
          const response = await ai.models.generateContent({
            model: activeModel,
            contents: toContents(input.messages),
            config: {
              systemInstruction: planTurnSystemPrompt(input.existingPages, input.activePageId),
              temperature: 0.7,
              responseMimeType: 'application/json',
              abortSignal: input.abortSignal,
            },
          });

          const text = response.text ?? '';
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            return { reply: text.trim() || 'Sorry, could you rephrase that?', action: 'chat', plannedPages: [] };
          }

          const result = turnPlanSchema.safeParse(parsed);
          if (!result.success) {
            return { reply: 'Sorry, I had trouble planning that. Could you rephrase?', action: 'chat', plannedPages: [] };
          }
          return result.data;
        },
        input.abortSignal
      );
    },

    async generateTheme(input: GenerateThemeInput): Promise<ThemeSpec> {
      return executeWithRetry(
        model,
        async (activeModel) => {
          const response = await ai.models.generateContent({
            model: activeModel,
            contents: toContents(input.messages),
            config: {
              systemInstruction: themeSystemPrompt(),
              temperature: 0.7,
              responseMimeType: 'application/json',
              maxOutputTokens: 8192,
              abortSignal: input.abortSignal,
            },
          });

          const text = response.text ?? '';
          let raw: unknown;
          try {
            raw = JSON.parse(text);
          } catch {
            throw new Error('The model returned an invalid theme.');
          }
          const parsed = themeSpecSchema.safeParse(raw);
          if (!parsed.success) {
            throw new Error('The model returned an invalid theme.');
          }
          return parsed.data;
        },
        input.abortSignal
      );
    },

    async *streamPage(input: StreamPageInput): AsyncIterable<string> {
      yield* streamWithRetry(
        model,
        async (activeModel) => {
          return ai.models.generateContentStream({
            model: activeModel,
            contents: toContents(input.messages),
            config: {
              systemInstruction: streamPageSystemPrompt(input.page, input.siblingPages, input.styleGuide),
              temperature: 0.8,
              maxOutputTokens: 32768,
              abortSignal: input.abortSignal,
            },
          });
        },
        input.abortSignal
      );
    },

    async editPage(input: EditPageInput): Promise<PagePatch> {
      return executeWithRetry(
        model,
        async (activeModel) => {
          const response = await ai.models.generateContent({
            model: activeModel,
            contents: toContents(input.messages),
            config: {
              systemInstruction: editPageSystemPrompt(input.page, input.html, input.styleGuide),
              temperature: 0.4,
              responseMimeType: 'application/json',
              maxOutputTokens: 32768,
              abortSignal: input.abortSignal,
            },
          });

          const text = response.text ?? '';
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            return { operations: [] as PagePatch['operations'] };
          }

          const result = pagePatchSchema.safeParse(parsed);
          if (!result.success) {
            return { operations: [] as PagePatch['operations'] };
          }
          return result.data;
        },
        input.abortSignal
      );
    },

    async generateShopifySection(input: ShopifySectionInput): Promise<ShopifySectionSpec> {
      return executeWithRetry(
        model,
        async (activeModel) => {
          const response = await ai.models.generateContent({
            model: activeModel,
            contents: [{ role: 'user', parts: [{ text: input.html }] }],
            config: {
              systemInstruction: shopifySectionSystemPrompt({
                brandName: input.brandName,
                pageType: input.pageType,
                pageLabel: input.pageLabel,
                role: input.role,
                styleGuide: input.styleGuide,
              }),
              temperature: 0.4,
              responseMimeType: 'application/json',
              maxOutputTokens: 32768,
              abortSignal: input.abortSignal,
            },
          });

          const text = response.text ?? '';
          let raw: unknown;
          try {
            raw = JSON.parse(text);
          } catch {
            throw new Error('The model returned an invalid Shopify section.');
          }
          const parsed = shopifySectionSpecSchema.safeParse(raw);
          if (!parsed.success) {
            throw new Error('The model returned an invalid Shopify section.');
          }
          return parsed.data;
        },
        input.abortSignal
      );
    },
  };
}

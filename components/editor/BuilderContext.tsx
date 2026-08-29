'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createEventParser, type BuilderPage, type GenerationStep } from '@/lib/ai/events';
import { sanitizeGeneratedHtml } from '@/lib/ai/sanitize';
import { applyPatchOperations } from '@/lib/ai/patch';
import { getProjectPages, savePage, deletePage, clearPages } from '@/lib/pages';
import { getProjectMessages, appendMessages, clearMessages } from '@/lib/messages';
import { getProjectTheme, saveTheme, clearTheme } from '@/lib/theme';
import { captureAndSaveThumbnail } from '@/lib/thumbnail';
import { AIClientConfig, DEFAULT_AI_CONFIG } from '@/lib/ai/models';

/**
 * Client-side builder state: chat messages, page tabs, and the live preview,
 * all driven by the NDJSON stream from `/api/ai`. This is the only place that
 * talks to the AI route so the editor components stay presentational.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type PageStatus = 'idle' | 'generating' | 'ready';

export interface PageState extends BuilderPage {
  html: string;
  status: PageStatus;
}

export interface CurrentStepState {
  step: GenerationStep;
  message: string;
  progress: number;
}

interface BuilderContextValue {
  messages: ChatMessage[];
  pages: PageState[];
  activePageId: string | null;
  activePage: PageState | null;
  /** The project's global stylesheet, applied to every page's preview. */
  themeCss: string;
  /** The project's shared style guide (brand, palette, component classes), if generated. */
  styleGuide: string | null;
  isStreaming: boolean;
  generatingPageId: string | null;
  currentStep: CurrentStepState | null;
  showCompletionNotification: boolean;
  dismissCompletionNotification: () => void;
  isImageGenerating: boolean;
  error: string | null;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  restoreBrandLogo: (brandName?: string) => void;
  sendMessage: (text: string, options?: SendMessageOptions) => void;
  retryLast: () => void;
  setActivePage: (id: string) => void;
  closePage: (id: string) => void;
  /**
   * Apply an in-preview inline edit to a page's HTML (from the iframe editor).
   * Sanitizes, updates state, and persists just that page. Returns the sanitized
   * HTML so the caller can avoid echoing it straight back into the iframe.
   */
  updatePageHtml: (pageId: string, html: string) => string;
  newChat: () => void;
  /** Active AI model & provider configuration (DeepSeek, OpenRouter, Gemini, OpenAI, etc.). */
  aiConfig: AIClientConfig;
  setAiConfig: (config: AIClientConfig) => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

interface SendMessageOptions {
  source?: 'chat' | 'image-edit';
}

interface BuilderSnapshot {
  messages: ChatMessage[];
  pages: PageState[];
  activePageId: string | null;
  kickedOff: boolean;
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder must be used within <BuilderProvider>.');
  return ctx;
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function getStorageKey(projectId: string): string {
  return `builder-session:${projectId}`;
}

function readSnapshot(projectId: string): BuilderSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BuilderSnapshot>;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      pages: Array.isArray(parsed.pages) ? parsed.pages : [],
      activePageId: typeof parsed.activePageId === 'string' ? parsed.activePageId : null,
      kickedOff: parsed.kickedOff === true,
    };
  } catch {
    return null;
  }
}

function writeSnapshot(projectId: string, snapshot: BuilderSnapshot): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(getStorageKey(projectId), JSON.stringify(snapshot));
}

/** Merge planned tabs into existing pages without duplicating ids. */
function mergePages(existing: PageState[], planned: BuilderPage[]): PageState[] {
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const page of planned) {
    if (!byId.has(page.id)) {
      byId.set(page.id, { ...page, html: '', status: 'idle' });
    }
  }
  return Array.from(byId.values());
}

export function BuilderProvider({
  projectId,
  initialPrompt,
  children,
}: {
  projectId: string;
  initialPrompt?: string;
  children: ReactNode;
}) {
  // State starts empty so the first client render matches the server-rendered
  // HTML (no hydration mismatch). The saved session is restored in an effect
  // after mount — see below.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pages, setPages] = useState<PageState[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [themeCss, setThemeCss] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatingPageId, setGeneratingPageId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CurrentStepState | null>(null);
  const [showCompletionNotification, setShowCompletionNotification] = useState(false);
  const dismissCompletionNotification = useCallback(() => setShowCompletionNotification(false), []);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Active AI Model and Provider configuration (DeepSeek, OpenRouter, Gemini, OpenAI, etc.)
  const [aiConfig, setAiConfigState] = useState<AIClientConfig>(DEFAULT_AI_CONFIG);
  const aiConfigRef = useRef<AIClientConfig>(DEFAULT_AI_CONFIG);
  useEffect(() => {
    aiConfigRef.current = aiConfig;
  }, [aiConfig]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('shopstudio_ai_config');
        if (saved && active) {
          const parsed = JSON.parse(saved) as AIClientConfig;
          if (parsed && typeof parsed === 'object') {
            setAiConfigState(parsed);
            aiConfigRef.current = parsed;
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setAiConfig = useCallback((newConfig: AIClientConfig) => {
    setAiConfigState(newConfig);
    aiConfigRef.current = newConfig;
    try {
      localStorage.setItem('shopstudio_ai_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  }, []);

  // Undo / Redo history tracking
  const historyRef = useRef<{ pages: PageState[]; activePageId: string | null }[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateCanUndoRedo = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(
    (newPages: PageState[], targetPageId: string | null) => {
      const currentSnap = historyRef.current[historyIndexRef.current];
      if (currentSnap) {
        const isSame =
          currentSnap.pages.length === newPages.length &&
          currentSnap.pages.every((p, i) => p.id === newPages[i]?.id && p.html === newPages[i]?.html);
        if (isSame) return;
      }

      const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      nextHistory.push({
        pages: newPages.map((p) => ({ ...p })),
        activePageId: targetPageId,
      });

      if (nextHistory.length > 50) {
        nextHistory.shift();
      }

      historyRef.current = nextHistory;
      historyIndexRef.current = nextHistory.length - 1;
      updateCanUndoRedo();
    },
    [updateCanUndoRedo]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const target = historyRef.current[historyIndexRef.current];
    if (!target) return;

    setPages(target.pages.map((p) => ({ ...p })));
    if (target.activePageId) setActivePageId(target.activePageId);

    target.pages.forEach((page, index) => {
      if (page.html) {
        void savePage(projectId, {
          pageKey: page.id,
          label: page.label,
          type: page.type,
          path: page.path,
          html: page.html,
          status: 'ready',
          position: index,
        }).catch(() => {});
      }
    });

    updateCanUndoRedo();
  }, [projectId, updateCanUndoRedo]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const target = historyRef.current[historyIndexRef.current];
    if (!target) return;

    setPages(target.pages.map((p) => ({ ...p })));
    if (target.activePageId) setActivePageId(target.activePageId);

    target.pages.forEach((page, index) => {
      if (page.html) {
        void savePage(projectId, {
          pageKey: page.id,
          label: page.label,
          type: page.type,
          path: page.path,
          html: page.html,
          status: 'ready',
          position: index,
        }).catch(() => {});
      }
    });

    updateCanUndoRedo();
  }, [projectId, updateCanUndoRedo]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Mirror of state read inside the async streaming loop (avoids stale closures).
  const stateRef = useRef({ messages, pages, activePageId });
  useEffect(() => {
    stateRef.current = { messages, pages, activePageId };
  }, [messages, pages, activePageId]);

  const kickedOff = useRef(false);
  const hydratedRef = useRef(false);

  // Persistence bookkeeping (see the persist effect below).
  const persistedMessageCountRef = useRef(0); // messages already written to the DB
  const pagesDirtyRef = useRef(false); // a page changed this turn and needs saving
  const erroredRef = useRef(false); // the current turn hit an error
  const persistArmedRef = useRef(false); // a completed turn is waiting to be persisted
  // The project's global theme: kept in a ref so the streaming request can read
  // it without re-subscribing, plus a dirty flag for persistence.
  const themeRef = useRef<{ css: string; styleGuide: string } | null>(null);
  const themeDirtyRef = useRef(false);
  // HTML last rasterized into the project's preview thumbnail — so an unchanged
  // page never triggers a redundant re-capture.
  const lastThumbnailHtmlRef = useRef<string | null>(null);

  // Load this project's saved pages + chat once, after mount. The database is the
  // source of truth across sessions; a same-session sessionStorage snapshot is
  // only a fallback (e.g. a reload mid-generation, before the turn was saved).
  // Setting state from async here is intentional; initial state is empty so SSR
  // hydration stays consistent.
  useEffect(() => {
    let active = true;

    const finish = () => {
      if (!active) return;
      hydratedRef.current = true;
      setHydrated(true);
    };

    (async () => {
      try {
        const [dbPages, dbMessages, dbTheme] = await Promise.all([
          getProjectPages(projectId),
          getProjectMessages(projectId),
          getProjectTheme(projectId),
        ]);
        if (!active) return;

        // Restore the project's global theme (if any) so every page renders with
        // the shared design system, and the next turn reuses it.
        if (dbTheme) {
          themeRef.current = { css: dbTheme.css, styleGuide: dbTheme.style_guide };
          setThemeCss(dbTheme.css);
        }

        if (dbPages.length > 0 || dbMessages.length > 0) {
          const loadedPages: PageState[] = dbPages.map((row) => ({
            id: row.page_key,
            label: row.label,
            type: row.type,
            path: row.path,
            html: row.html,
            status: row.html ? 'ready' : 'idle',
          }));
          const loadedMessages: ChatMessage[] = dbMessages.map((row) => ({
            id: newId(),
            role: row.role,
            content: row.content,
          }));
          setMessages(loadedMessages);
          setPages(loadedPages);
          setActivePageId(loadedPages[0]?.id ?? null);
          pushHistory(loadedPages, loadedPages[0]?.id ?? null);
          persistedMessageCountRef.current = loadedMessages.length;
          kickedOff.current = true; // a saved project must not re-run its founding prompt
          finish();
          return;
        }
      } catch {
        // Fall through to the sessionStorage fallback below.
      }

      if (!active) return;
      const snapshot = readSnapshot(projectId);
      if (snapshot) {
        setMessages(snapshot.messages);
        setPages(snapshot.pages);
        setActivePageId(snapshot.activePageId);
        pushHistory(snapshot.pages, snapshot.activePageId);
        kickedOff.current = snapshot.kickedOff;
      }
      finish();
    })();

    return () => {
      active = false;
    };
  }, [projectId, pushHistory]);

  // Persist the session — but only after hydration, so we never overwrite a
  // saved session with the empty initial state.
  useEffect(() => {
    if (!hydratedRef.current) return;
    writeSnapshot(projectId, {
      messages,
      pages,
      activePageId,
      kickedOff: kickedOff.current,
    });
  }, [projectId, messages, pages, activePageId]);

  const abortRef = useRef<AbortController | null>(null);
  // Accumulated raw HTML per streaming page + a throttled flush to the preview.
  const rawHtmlRef = useRef<Record<string, string>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounced DB writes for inline edits, so dragging a style slider persists
  // once it settles instead of on every input event.
  const editPersistTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sendMessage = useCallback((text: string, options?: SendMessageOptions) => {
    const content = text.trim();
    if (!content || abortRef.current) return;

    const priorMessages = stateRef.current.messages;
    const outgoing = [...priorMessages, { role: 'user' as const, content }];
    const isImageEditRequest = options?.source === 'image-edit';

    const assistantId = newId();
    erroredRef.current = false;
    setError(null);
    setShowCompletionNotification(false);
    setCurrentStep({ step: 'planning', message: 'Connecting to AI builder…', progress: 10 });
    setIsImageGenerating(isImageEditRequest);
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: 'user', content },
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const updateAssistant = (updater: (text: string) => string) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: updater(m.content) } : m))
      );

    (async () => {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: outgoing.map(({ role, content }) => ({ role, content })),
            pages: stateRef.current.pages.map(({ id, label, type, path }) => ({ id, label, type, path })),
            activePageId: stateRef.current.activePageId,
            // Send only the open page's HTML so a scoped edit can target its
            // existing ids without regenerating the whole page.
            activePageHtml:
              stateRef.current.pages.find((p) => p.id === stateRef.current.activePageId)?.html ?? null,
            // The project's shared theme (if generated). Lets the server reuse the
            // same design system and skip regenerating it.
            theme: themeRef.current,
            aiConfig: aiConfigRef.current,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed (${res.status}).`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const parser = createEventParser();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const event of parser.push(decoder.decode(value, { stream: true }))) {
            switch (event.type) {
              case 'status':
                setCurrentStep({
                  step: event.step,
                  message: event.message,
                  progress: event.progress ?? 0,
                });
                break;
              case 'message':
                updateAssistant(() => event.text);
                break;
              case 'theme':
                // Store the project's global stylesheet; it applies to every page.
                themeRef.current = { css: event.css, styleGuide: event.styleGuide };
                themeDirtyRef.current = true;
                setThemeCss(event.css);
                break;
              case 'plan':
                pagesDirtyRef.current = true;
                setPages((prev) => mergePages(prev, event.pages));
                break;
              case 'page_start':
                pagesDirtyRef.current = true;
                rawHtmlRef.current[event.page.id] = '';
                setPages((prev) =>
                  mergePages(prev, [event.page]).map((p) =>
                    p.id === event.page.id ? { ...p, status: 'generating', html: '' } : p
                  )
                );
                setActivePageId(event.page.id);
                setGeneratingPageId(event.page.id);
                break;
              case 'page_delta': {
                const pageId = event.pageId;
                rawHtmlRef.current[pageId] = (rawHtmlRef.current[pageId] ?? '') + event.chunk;
                // Throttle preview updates (~8/sec) so we sanitize + re-render a
                // handful of times, not once per streamed token.
                if (flushTimerRef.current == null) {
                  flushTimerRef.current = setTimeout(() => {
                    flushTimerRef.current = null;
                    const html = sanitizeGeneratedHtml(rawHtmlRef.current[pageId] ?? '');
                    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, html } : p)));
                  }, 120);
                }
                break;
              }
              case 'page_end': {
                if (flushTimerRef.current != null) {
                  clearTimeout(flushTimerRef.current);
                  flushTimerRef.current = null;
                }
                delete rawHtmlRef.current[event.pageId];
                setPages((prev) =>
                  prev.map((p) =>
                    p.id === event.pageId ? { ...p, html: event.html, status: 'ready' } : p
                  )
                );
                setGeneratingPageId(null);
                break;
              }
              case 'page_patch': {
                // Scoped edit: apply the operations to the existing page HTML in
                // place, so unrelated sections are preserved (no regeneration).
                const pageId = event.pageId;
                pagesDirtyRef.current = true;
                setPages((prev) =>
                  prev.map((p) =>
                    p.id === pageId
                      ? {
                          ...p,
                          html: sanitizeGeneratedHtml(applyPatchOperations(p.html, event.operations)),
                          status: 'ready',
                        }
                      : p
                  )
                );
                setActivePageId(pageId);
                break;
              }
              case 'error':
                erroredRef.current = true;
                setError(event.message);
                setCurrentStep(null);
                setShowCompletionNotification(false);
                setGeneratingPageId(null);
                setPages((prev) =>
                  prev.map((p) =>
                    p.status === 'generating' ? { ...p, status: p.html ? 'ready' : 'idle' } : p
                  )
                );
                updateAssistant((t) => t || 'Something went wrong while generating.');
                break;
              case 'done':
                setCurrentStep(null);
                setShowCompletionNotification(true);
                break;
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          erroredRef.current = true;
          setError(err instanceof Error ? err.message : 'Generation failed.');
          setCurrentStep(null);
          setShowCompletionNotification(false);
          setGeneratingPageId(null);
          setPages((prev) =>
            prev.map((p) =>
              p.status === 'generating' ? { ...p, status: p.html ? 'ready' : 'idle' } : p
            )
          );
          updateAssistant((t) => t || 'Something went wrong. Please try again.');
        }
      } finally {
        // Arm persistence only for a clean turn; the persist effect saves the
        // final committed state once streaming stops.
        persistArmedRef.current = !controller.signal.aborted && !erroredRef.current;
        abortRef.current = null;
        setIsStreaming(false);
        setIsImageGenerating(false);
        setGeneratingPageId(null);
        setCurrentStep(null);
      }
    })();
  }, []);

  // Persist a completed turn to the database: append any not-yet-saved chat
  // messages and upsert changed pages. Only one page/message set is written per
  // turn, so a small edit saves just the page it touched — never the whole
  // project (AGENTS.md §8).
  const persistTurn = useCallback(
    async (currentPages: PageState[], currentMessages: ChatMessage[]) => {
      try {
        // Save the project's global theme first, so pages that reference its
        // shared classes are never persisted ahead of the stylesheet itself.
        if (themeDirtyRef.current && themeRef.current) {
          themeDirtyRef.current = false;
          await saveTheme(projectId, themeRef.current);
        }

        const alreadySaved = persistedMessageCountRef.current;
        const newMessages = currentMessages.slice(alreadySaved);
        if (newMessages.length > 0) {
          await appendMessages(
            projectId,
            newMessages.map((m, i) => ({
              role: m.role,
              content: m.content,
              position: alreadySaved + i,
            }))
          );
          persistedMessageCountRef.current = alreadySaved + newMessages.length;
        }

        if (pagesDirtyRef.current) {
          pagesDirtyRef.current = false;
          await Promise.all(
            currentPages.map((p, i) =>
              savePage(projectId, {
                pageKey: p.id,
                label: p.label,
                type: p.type,
                path: p.path,
                html: p.html,
                status: p.status,
                position: i,
              })
            )
          );
        }
      } catch {
        // Persistence is best-effort; the in-memory + sessionStorage state stays.
      }

      // Refresh the project's card thumbnail from the home (or first ready) page
      // once a turn settles. Fully best-effort and non-blocking — a capture
      // failure never affects generation or persistence (AGENTS.md §8).
      const previewPage =
        currentPages.find((p) => p.type === 'home' && p.status === 'ready' && p.html.trim()) ??
        currentPages.find((p) => p.status === 'ready' && p.html.trim());
      if (previewPage && previewPage.html !== lastThumbnailHtmlRef.current) {
        lastThumbnailHtmlRef.current = previewPage.html;
        void captureAndSaveThumbnail(projectId, previewPage.html, themeRef.current?.css ?? '');
      }
    },
    [projectId]
  );

  // When a turn finishes streaming, save the final committed state. Runs after
  // `isStreaming` flips false, so `pages`/`messages` are fully up to date.
  useEffect(() => {
    if (isStreaming || !persistArmedRef.current) return;
    persistArmedRef.current = false;
    void persistTurn(pages, messages);
  }, [isStreaming, pages, messages, persistTurn]);

  // Auto-send the project's founding prompt exactly once — after the saved
  // session has been restored, so a completed project doesn't re-generate.
  useEffect(() => {
    if (!hydrated || kickedOff.current) return;
    if (initialPrompt && initialPrompt.trim()) {
      kickedOff.current = true;
      sendMessage(initialPrompt);
    }
  }, [hydrated, initialPrompt, sendMessage]);

  // Inline edits from the sandboxed preview: the iframe owns the DOM and posts
  // back the whole edited body. Sanitize it (same pipeline as generated/patch
  // HTML — AGENTS.md §9), update state, and persist just this one page.
  const updatePageHtml = useCallback(
    (pageId: string, html: string): string => {
      const clean = sanitizeGeneratedHtml(html);
      setPages((prev) => {
        const next = prev.map((p) => (p.id === pageId ? { ...p, html: clean, status: 'ready' as const } : p));
        pushHistory(next, pageId);
        return next;
      });

      const timers = editPersistTimersRef.current;
      if (timers[pageId]) clearTimeout(timers[pageId]);
      timers[pageId] = setTimeout(() => {
        delete timers[pageId];
        const page = stateRef.current.pages.find((p) => p.id === pageId);
        if (!page) return;
        const index = stateRef.current.pages.findIndex((p) => p.id === pageId);
        void savePage(projectId, {
          pageKey: page.id,
          label: page.label,
          type: page.type,
          path: page.path,
          html: clean,
          status: 'ready',
          position: index < 0 ? 0 : index,
        }).catch(() => {});
      }, 600);

      return clean;
    },
    [projectId, pushHistory]
  );

  const restoreBrandLogo = useCallback(
    (name?: string) => {
      const brandNameToUse = (name || initialPrompt || 'Storefront').slice(0, 30);
      const curPageId = stateRef.current.activePageId;
      if (!curPageId) return;
      const curPage = stateRef.current.pages.find((p) => p.id === curPageId);
      if (!curPage || !curPage.html) return;

      let newHtml = curPage.html;
      if (newHtml.includes('<header') || newHtml.includes('site-header')) {
        if (!newHtml.includes('brand-logo')) {
          newHtml = newHtml.replace(
            /(<header\b[^>]*>[\s\S]*?<nav\b)/i,
            `<a href="/" class="brand-logo font-bold text-xl text-brand tracking-tight">${brandNameToUse}</a>$1`
          );
        } else {
          newHtml = newHtml.replace(
            /(<a\b[^>]*class="[^"]*brand-logo[^"]*"[^>]*>)([\s\S]*?)(<\/a>)/i,
            `$1${brandNameToUse}$3`
          );
        }
      }

      updatePageHtml(curPageId, newHtml);
    },
    [initialPrompt, updatePageHtml]
  );

  const setActivePage = useCallback((id: string) => setActivePageId(id), []);

  const closePage = useCallback(
    (id: string) => {
      setPages((prev) => {
        const next = prev.filter((p) => p.id !== id);
        setActivePageId((current) => (current === id ? next[0]?.id ?? null : current));
        return next;
      });
      // Remove the tab from the project permanently.
      void deletePage(projectId, id).catch(() => {});
    },
    [projectId]
  );

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (flushTimerRef.current != null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    rawHtmlRef.current = {};
    kickedOff.current = true; // don't re-fire the initial prompt after a reset
    persistArmedRef.current = false; // don't persist the cleared state as a turn
    persistedMessageCountRef.current = 0;
    pagesDirtyRef.current = false;
    themeRef.current = null;
    themeDirtyRef.current = false;
    lastThumbnailHtmlRef.current = null;
    historyRef.current = [];
    historyIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    setMessages([]);
    setPages([]);
    setActivePageId(null);
    setThemeCss('');
    setGeneratingPageId(null);
    setCurrentStep(null);
    setShowCompletionNotification(false);
    setIsImageGenerating(false);
    setError(null);
    setIsStreaming(false);
    writeSnapshot(projectId, {
      messages: [],
      pages: [],
      activePageId: null,
      kickedOff: true,
    });
    // Wipe the saved project so a fresh build starts clean.
    void Promise.all([
      clearMessages(projectId),
      clearPages(projectId),
      clearTheme(projectId),
    ]).catch(() => {});
  }, [projectId]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (flushTimerRef.current != null) clearTimeout(flushTimerRef.current);
      Object.values(editPersistTimersRef.current).forEach(clearTimeout);
    },
    []
  );

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) ?? null,
    [pages, activePageId]
  );

  const retryLast = useCallback(() => {
    if (abortRef.current || isStreaming) return;
    const currentMsgs = stateRef.current.messages;
    const lastUserMsg = [...currentMsgs].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      if (initialPrompt && initialPrompt.trim()) {
        sendMessage(initialPrompt);
      }
      return;
    }
    // Remove the trailing assistant message if it was an error/incomplete response
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].role === 'assistant') {
        return prev.slice(0, lastIndex);
      }
      return prev;
    });
    sendMessage(lastUserMsg.content);
  }, [initialPrompt, isStreaming, sendMessage]);

  const value: BuilderContextValue = {
    messages,
    pages,
    activePageId,
    activePage,
    themeCss,
    styleGuide: themeRef.current?.styleGuide ?? null,
    isStreaming,
    generatingPageId,
    currentStep,
    showCompletionNotification,
    dismissCompletionNotification,
    isImageGenerating,
    error,
    canUndo,
    canRedo,
    undo,
    redo,
    restoreBrandLogo,
    sendMessage,
    retryLast,
    setActivePage,
    closePage,
    updatePageHtml,
    newChat,
    aiConfig,
    setAiConfig,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

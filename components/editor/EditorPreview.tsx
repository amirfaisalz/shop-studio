'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Check,
  Grid3x3,
  Home,
  Loader2,
  Monitor,
  Pencil,
  RotateCw,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tablet,
  Wallet,
  X,
} from 'lucide-react';
import { buildPreviewShell } from '@/lib/ai/sanitize';
import { useBuilder, type PageState } from './BuilderContext';
import type { PageType } from '@/lib/ai/events';

interface MissingPageInfo {
  path: string;
  label: string;
  suggestedPrompt: string;
}

function deducePageInfo(href: string): { label: string; prompt: string } {
  const clean = href.split('?')[0].split('#')[0].toLowerCase();

  if (
    clean.includes('/collections') ||
    clean.includes('/collection') ||
    clean.includes('/catalog') ||
    clean.includes('/shop')
  ) {
    return {
      label: 'Collection / Catalog Page',
      prompt:
        'Generate the Collection catalog page with responsive product grid, filters, sorting dropdown, and category badges for this Shopify store',
    };
  }
  if (clean.includes('/products') || clean.includes('/product') || clean.includes('/item')) {
    return {
      label: 'Product Details Page',
      prompt:
        'Generate the dedicated Product detail page with image gallery, pricing, variant selectors, stock badge, and sticky Add-to-Cart bar for this Shopify store',
    };
  }
  if (clean.includes('/cart')) {
    return {
      label: 'Cart Summary Page',
      prompt:
        'Generate the Cart page with item breakdown, free shipping progress bar, promo coupon code input, and checkout button for this Shopify store',
    };
  }
  if (clean.includes('/about') || clean.includes('/story')) {
    return {
      label: 'About Us / Brand Story Page',
      prompt:
        'Generate an About Us page highlighting the brand story, artisanal craft, founder note, and quality commitments for this store',
    };
  }
  if (clean.includes('/contact') || clean.includes('/support') || clean.includes('/help')) {
    return {
      label: 'Contact & Support Page',
      prompt:
        'Generate a Contact Us page with customer support form, FAQ shortcuts, store location, and business hours',
    };
  }
  if (clean.includes('/blog') || clean.includes('/news') || clean.includes('/articles')) {
    return {
      label: 'Blog / Journal Page',
      prompt:
        'Generate a Blog / Journal page with featured articles, recipe/craft guides, and newsletter subscription',
    };
  }

  // General slug deduction
  const slug = clean.replace(/^\/+|\/+$/g, '') || 'custom-page';
  const rawName = slug.split('/').pop()?.replace(/[-_]/g, ' ') || 'New Page';
  const capitalized = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  return {
    label: `${capitalized} Page`,
    prompt: `Generate the "${capitalized}" page for this Shopify store with modern responsive sections and content matching the store theme`,
  };
}

const PAGE_ICONS: Record<PageType, typeof Home> = {
  home: Home,
  product: Box,
  collection: Grid3x3,
  cart: ShoppingCart,
  checkout: Wallet,
  custom: Grid3x3,
};

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: Viewport; label: string; icon: typeof Monitor; width: string }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '390px' },
];

const STORE_DOMAIN = 'your-store.myshopify.com';

export default function EditorPreview() {
  const {
    pages,
    activePage,
    activePageId,
    themeCss,
    setActivePage,
    closePage,
    generatingPageId,
    isStreaming,
    isImageGenerating,
    error,
    retryLast,
    sendMessage,
    updatePageHtml,
  } = useBuilder();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [missingPagePrompt, setMissingPagePrompt] = useState<MissingPageInfo | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  // The last body HTML we received *from* the iframe (an inline edit). Guards the
  // postBody effect so we never echo an edit straight back and reset the frame.
  const lastSyncedHtmlRef = useRef<string | null>(null);
  const viewportWidth = VIEWPORTS.find((v) => v.id === viewport)?.width ?? '100%';

  // The iframe document is built once (Tailwind loads a single time); content is
  // streamed in via postMessage so live updates never reload the frame.
  const shell = useMemo(() => buildPreviewShell(), []);
  const activeHtml = activePage?.html ?? '';

  const postBody = (html: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'builder:setBody', html }, '*');
  };

  const postTheme = (css: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'builder:setTheme', css }, '*');
  };

  const postEditMode = (enabled: boolean) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'builder:setEditMode', enabled }, '*');
  };

  // Latest values the (mount-once) message listener needs, without re-subscribing.
  const ctxRef = useRef({
    pages,
    activePageId,
    activeHtml,
    themeCss,
    editMode,
    sendMessage,
    setActivePage,
    updatePageHtml,
  });
  useEffect(() => {
    ctxRef.current = {
      pages,
      activePageId,
      activeHtml,
      themeCss,
      editMode,
      sendMessage,
      setActivePage,
      updatePageHtml,
    };
  });

  // Single listener for every iframe -> parent message. The iframe owns the
  // preview DOM (sandboxed, no same-origin), so inline edits and AI requests all
  // arrive here as postMessages.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data.type !== 'string') return;
      const ctx = ctxRef.current;

      if (data.type === 'builder:ready') {
        readyRef.current = true;
        postTheme(ctx.themeCss);
        postBody(ctx.activeHtml);
        if (ctx.editMode) postEditMode(true);
      } else if (data.type === 'builder:bodyChanged') {
        // An inline edit was applied inside the preview; persist just this page.
        if (!ctx.activePageId || typeof data.html !== 'string') return;
        lastSyncedHtmlRef.current = ctx.updatePageHtml(ctx.activePageId, data.html);
      } else if (data.type === 'builder:navigate' && typeof data.href === 'string') {
        const href = data.href.trim();
        const cleanHref = href.split('?')[0].split('#')[0].toLowerCase();
        const currentPages = ctx.pages;

        let targetPage = currentPages.find((p) => p.path.toLowerCase() === cleanHref);
        if (!targetPage) {
          if (cleanHref === '/' || cleanHref === '') {
            targetPage = currentPages.find((p) => p.type === 'home' || p.id === 'home');
          } else if (cleanHref.includes('/products/') || cleanHref === '/product' || cleanHref === '/products') {
            targetPage = currentPages.find((p) => p.type === 'product' || p.id === 'product');
          } else if (cleanHref.includes('/collections/') || cleanHref === '/collection' || cleanHref === '/collections') {
            targetPage = currentPages.find((p) => p.type === 'collection' || p.id === 'collection');
          } else if (cleanHref.includes('/cart')) {
            targetPage = currentPages.find((p) => p.type === 'cart' || p.id === 'cart');
          }
        }

        if (targetPage && targetPage.html && targetPage.html.trim()) {
          ctx.setActivePage(targetPage.id);
        } else {
          // If the page does not exist in the project yet (or has no HTML), show an interactive modal
          const info = deducePageInfo(href);
          setMissingPagePrompt({
            path: href,
            label: info.label,
            suggestedPrompt: info.prompt,
          });
        }
      } else if (data.type === 'builder:requestAIEdit' || data.type === 'builder:requestAIImage') {
        const isImage = data.type === 'builder:requestAIImage';
        const targetId = typeof data.targetId === 'string' ? data.targetId : '';
        const prompt = typeof data.prompt === 'string' ? data.prompt : '';
        if (!prompt) return;
        ctx.sendMessage(
          isImage
            ? `Update the image in the element with id "${targetId}": ${prompt}`
            : `In the element with id "${targetId}": ${prompt}`,
          { source: isImage ? 'image-edit' : 'chat' }
        );
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Switching pages invalidates the echo guard (each page has its own HTML).
  useEffect(() => {
    lastSyncedHtmlRef.current = null;
  }, [activePageId]);

  useEffect(() => {
    if (!readyRef.current) return;
    // Skip when this HTML is the inline edit we just received from the iframe —
    // re-posting it would wipe the frame's live edit state.
    if (activeHtml === lastSyncedHtmlRef.current) return;
    postBody(activeHtml);
  }, [activeHtml, activePageId]);

  // Push the global stylesheet whenever it changes so every page stays on-theme.
  useEffect(() => {
    if (readyRef.current) postTheme(themeCss);
  }, [themeCss]);

  // Toggle edit mode inside the preview whenever the button flips.
  useEffect(() => {
    if (readyRef.current) postEditMode(editMode);
  }, [editMode]);

  // A manual reload remounts the frame, so it must re-handshake.
  useEffect(() => {
    readyRef.current = false;
  }, [reloadKey]);  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-none md:rounded-2xl border-0 md:border md:border-neutral-200/90 bg-white md:shadow-xs">
        {/* Browser tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200/80 bg-[#F9F7F5] px-2 pt-2">
          {pages.length === 0 && (
            <div className="flex h-9 items-center px-3 text-xs font-semibold text-neutral-400">No pages yet</div>
          )}
          {pages.map((tab) => (
            <PreviewTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activePageId}
              isGenerating={tab.id === generatingPageId}
              onSelect={() => setActivePage(tab.id)}
              onClose={() => closePage(tab.id)}
            />
          ))}
        </div>

        {/* Browser toolbar / address bar */}
        <div className="flex items-center gap-3 border-b border-neutral-200/80 bg-white px-3.5 py-2">
          {/* macOS window indicator dots */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] ring-1 ring-black/5" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] ring-1 ring-black/5" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F] ring-1 ring-black/5" />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200/90 bg-neutral-50 px-3 py-1.5 shadow-2xs">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-[9px] font-black text-emerald-700">
              ✓
            </span>
            <span className="truncate text-xs font-medium text-neutral-700">
              <span className="font-semibold text-neutral-900">{STORE_DOMAIN}</span>
              <span className="text-neutral-400">{activePage?.path ?? '/'}</span>
            </span>
            <button
              aria-label="Reload preview"
              onClick={() => setReloadKey((k) => k + 1)}
              className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700 cursor-pointer"
            >
              <RotateCw size={13} strokeWidth={2} />
            </button>
          </div>

          {/* Viewport switchers (Desktop / Tablet / Mobile) */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-200/90 bg-neutral-50 p-0.5">
            {VIEWPORTS.map((v) => {
              const Icon = v.icon;
              const isActive = v.id === viewport;
              return (
                <button
                  key={v.id}
                  aria-label={v.label}
                  aria-pressed={isActive}
                  onClick={() => setViewport(v.id)}
                  className={`grid h-7 w-7 place-items-center rounded-lg transition cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC] shadow-2xs'
                      : 'text-neutral-400 hover:bg-white hover:text-neutral-700'
                  }`}
                >
                  <Icon size={14} strokeWidth={2} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-[#FBF9F7] p-2 md:p-3">
          <div
            className="relative mx-auto h-full min-h-full overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-2xs transition-[max-width] duration-300"
            style={{ maxWidth: viewportWidth }}
          >
            {/* Inline-edit toggle — top-right of the preview. */}
            {activePage && activeHtml && (
              <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                {isImageGenerating && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#FFCCBC] bg-white/95 px-3 py-1.5 text-xs font-bold text-[#FF3B00] shadow-sm backdrop-blur">
                    <Loader2 size={14} strokeWidth={2.4} className="animate-spin text-[#FF3B00]" />
                    <span>Generating image…</span>
                  </div>
                )}
                <button
                  onClick={() => setEditMode((v) => !v)}
                  aria-pressed={editMode}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer ${
                    editMode
                      ? 'border-transparent bg-[#FF3B00] text-white hover:bg-[#E03E00] shadow-[0_2px_10px_rgba(255,59,0,0.3)]'
                      : 'border-neutral-200 bg-white/95 text-neutral-700 backdrop-blur hover:bg-white hover:text-neutral-950'
                  }`}
                >
                  {editMode ? <Check size={14} strokeWidth={2.4} /> : <Pencil size={14} strokeWidth={2} />}
                  <span>{editMode ? 'Done' : 'Edit Elements'}</span>
                </button>
              </div>
            )}

            {activePage ? (
              <iframe
                key={reloadKey}
                ref={iframeRef}
                title={`${activePage.label} preview`}
                srcDoc={shell}
                sandbox="allow-scripts"
                onLoad={() => {
                  readyRef.current = true;
                  lastSyncedHtmlRef.current = null;
                  postTheme(themeCss);
                  postBody(activeHtml);
                  if (editMode) postEditMode(true);
                }}
                className="h-full min-h-[320px] w-full border-0"
              />
            ) : (
              <div className="grid h-full min-h-[320px] place-items-center">
                <div className="flex flex-col items-center gap-3 text-center text-neutral-400">
                  {generatingPageId ? (
                    <>
                      <Loader2 size={22} className="animate-spin text-[#FF3B00]" />
                      <p className="text-xs font-bold text-neutral-700">Generating your preview…</p>
                    </>
                  ) : (
                    <p className="text-xs font-medium">
                      Your storefront preview will appear here.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Overlay while a page is still empty and generating. */}
            {activePage && !activeHtml && generatingPageId === activePage.id && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white">
                <div className="flex flex-col items-center gap-3 text-center text-neutral-400">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white animate-pulse">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <p className="text-xs font-bold text-neutral-900">Generating sections for {activePage.label}…</p>
                </div>
              </div>
            )}

            {/* Overlay if generation was interrupted or errored and page is empty */}
            {activePage && !activeHtml && !generatingPageId && error && (
              <div className="absolute inset-0 grid place-items-center bg-white p-6">
                <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                    <RotateCw size={22} strokeWidth={2} />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-950">Generation was interrupted</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed font-medium">{error}</p>
                  <button
                    type="button"
                    onClick={retryLast}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:brightness-105 transition cursor-pointer"
                  >
                    <RotateCw size={13} strokeWidth={2.2} />
                    <span>Retry Generation</span>
                  </button>
                </div>
              </div>
            )}

            {/* Missing Page Modal / Interactive Notification */}
            {missingPagePrompt && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                        <Sparkles size={20} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-neutral-950">
                          Halaman Belum Dibuat
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Tautan: <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[#FF3B00] font-bold border border-neutral-200">{missingPagePrompt.path}</code>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Tutup dialog"
                      onClick={() => setMissingPagePrompt(null)}
                      className="grid h-8 w-8 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-700">
                    <p className="font-bold text-neutral-950 mb-1">
                      Tipe Halaman: <span className="text-[#FF3B00]">{missingPagePrompt.label}</span>
                    </p>
                    <p className="text-neutral-500 leading-relaxed font-medium">
                      Halaman ini belum ada di tema toko Anda. Ingin AI membuatkan halaman ini sekarang dengan tata letak & gaya visual yang selaras?
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMissingPagePrompt(null)}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const promptToSend = missingPagePrompt.suggestedPrompt;
                        setMissingPagePrompt(null);
                        sendMessage(promptToSend);
                      }}
                      disabled={isStreaming}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-4 py-2 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Buat Halaman Ini ✨</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewTab({
  tab,
  isActive,
  isGenerating,
  onSelect,
  onClose,
}: {
  tab: PageState;
  isActive: boolean;
  isGenerating: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const Icon = PAGE_ICONS[tab.type] ?? Grid3x3;
  return (
    <div
      className={`group flex h-9 min-w-0 max-w-[190px] shrink-0 items-center gap-2 rounded-t-xl px-3 text-xs transition cursor-pointer ${
        isActive
          ? '-mb-px border-x border-t border-neutral-200/90 bg-white font-bold text-neutral-950 shadow-2xs'
          : 'text-neutral-500 hover:bg-white/80 hover:text-neutral-800'
      }`}
    >
      <button onClick={onSelect} className="flex min-w-0 items-center gap-2 cursor-pointer">
        {isGenerating ? (
          <Loader2 size={13} className="animate-spin text-[#FF3B00]" />
        ) : (
          <Icon size={14} strokeWidth={2} className={isActive ? 'text-[#FF3B00]' : 'text-neutral-400'} />
        )}
        <span className="truncate">{tab.label}</span>
      </button>
      <button
        aria-label={`Close ${tab.label}`}
        onClick={onClose}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-neutral-400 opacity-0 transition hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100 cursor-pointer"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
    </div>
  );
}


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
  }, [reloadKey]);

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ece6e2] bg-white shadow-[0_10px_30px_rgba(31,41,55,0.05)]">
        {/* Browser tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#efeae6] bg-[#f4f0ec] px-2 pt-2">
          {pages.length === 0 && (
            <div className="flex h-9 items-center px-3 text-sm text-[#9aa2af]">No pages yet</div>
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
        <div className="flex items-center gap-3 border-b border-[#efeae6] bg-white px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#eee7e3] bg-[#faf8f6] px-3 py-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#e8f6ee] text-[9px] font-bold text-[#35b86b]">
              ✓
            </span>
            <span className="truncate text-[13px] text-[#6b7280]">
              {STORE_DOMAIN}
              <span className="text-[#9aa2af]">{activePage?.path ?? '/'}</span>
            </span>
            <button
              aria-label="Reload preview"
              onClick={() => setReloadKey((k) => k + 1)}
              className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#9aa2af] transition hover:bg-black/5 hover:text-[#4b5563]"
            >
              <RotateCw size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#eee7e3] bg-white p-0.5">
            {VIEWPORTS.map((v) => {
              const Icon = v.icon;
              const isActive = v.id === viewport;
              return (
                <button
                  key={v.id}
                  aria-label={v.label}
                  aria-pressed={isActive}
                  onClick={() => setViewport(v.id)}
                  className={`grid h-7 w-7 place-items-center rounded-md transition ${isActive
                      ? 'bg-[#fff3ef] text-[#f05a32]'
                      : 'text-[#9aa2af] hover:bg-[#faf8f6] hover:text-[#4b5563]'
                    }`}
                >
                  <Icon size={15} strokeWidth={1.9} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-[#fafafa]">
          <div
            className="relative mx-auto h-full min-h-full overflow-hidden rounded-xl border border-[#ece6e2] bg-white transition-[max-width] duration-300"
            style={{ maxWidth: viewportWidth }}
          >
            {/* Inline-edit toggle — top-right of the preview. */}
            {activePage && activeHtml && (
              <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                {isImageGenerating && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#ffd7ce] bg-white/95 px-3 py-1.5 text-[13px] font-medium text-[#c0432f] shadow-sm backdrop-blur">
                    <Loader2 size={15} strokeWidth={2.2} className="animate-spin" />
                    Generating image…
                  </div>
                )}
                <button
                  onClick={() => setEditMode((v) => !v)}
                  aria-pressed={editMode}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium shadow-sm transition ${
                    editMode
                      ? 'border-transparent bg-[#f05a32] text-white hover:bg-[#e14a24]'
                      : 'border-[#eee7e3] bg-white/90 text-[#4b5563] backdrop-blur hover:bg-white hover:text-[#111827]'
                  }`}
                >
                  {editMode ? <Check size={15} strokeWidth={2.2} /> : <Pencil size={15} strokeWidth={2} />}
                  {editMode ? 'Done' : 'Edit'}
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
                  // Reliable trigger (independent of the postMessage handshake):
                  // by load, the shell's listener is attached and Tailwind is ready.
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
                <div className="flex flex-col items-center gap-3 text-center text-[#9aa2af]">
                  {generatingPageId ? (
                    <>
                      <Loader2 size={22} className="animate-spin text-[#ff8a66]" />
                      <p className="text-sm font-medium">Generating your preview…</p>
                    </>
                  ) : (
                    <p className="text-sm font-medium">
                      Your storefront preview will appear here.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Overlay while a page is still empty and generating. */}
            {activePage && !activeHtml && generatingPageId === activePage.id && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white">
                <div className="flex flex-col items-center gap-3 text-center text-[#9aa2af]">
                  <Loader2 size={22} className="animate-spin text-[#ff8a66]" />
                  <p className="text-sm font-medium">Generating your {activePage.label}…</p>
                </div>
              </div>
            )}

            {/* Overlay if generation was interrupted or errored and page is empty */}
            {activePage && !activeHtml && !generatingPageId && error && (
              <div className="absolute inset-0 grid place-items-center bg-white p-6">
                <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0ec] text-[#ff6747]">
                    <RotateCw size={22} strokeWidth={2} />
                  </div>
                  <h4 className="text-sm font-bold text-[#111827]">Generation was interrupted</h4>
                  <p className="text-xs text-[#6b7280] leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={retryLast}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[#ff6747] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#f85b3a] transition"
                  >
                    <RotateCw size={13} strokeWidth={2.2} />
                    Retry Generation
                  </button>
                </div>
              </div>
            )}

            {/* Missing Page Modal / Interactive Notification */}
            {missingPagePrompt && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="w-full max-w-md rounded-2xl border border-[#ece6e2] bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.22)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0eb] text-[#ff6747]">
                        <Sparkles size={20} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#111827]">
                          Halaman Belum Dibuat
                        </h3>
                        <p className="text-xs text-[#6b7280]">
                          Tautan: <code className="rounded bg-[#f4f0ec] px-1.5 py-0.5 font-mono text-[#ff6747] font-semibold">{missingPagePrompt.path}</code>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Tutup dialog"
                      onClick={() => setMissingPagePrompt(null)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-[#9aa2af] transition hover:bg-[#f4f0ec] hover:text-[#111827]"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#f0eae6] bg-[#faf8f6] p-3.5 text-xs text-[#4b5563]">
                    <p className="font-semibold text-[#111827] mb-1">
                      Tipe Halaman: <span className="text-[#ff6747]">{missingPagePrompt.label}</span>
                    </p>
                    <p className="text-[#6b7280] leading-relaxed">
                      Halaman ini belum ada di tema toko Anda. Ingin AI membuatkan halaman ini sekarang dengan tata letak & gaya visual yang selaras?
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMissingPagePrompt(null)}
                      className="rounded-xl border border-[#e8e2de] bg-white px-4 py-2 text-xs font-semibold text-[#4b5563] transition hover:bg-[#f9f8f6]"
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
                      className="flex items-center gap-2 rounded-xl bg-[#ff6747] px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(255,103,71,0.24)] transition hover:bg-[#f85b3a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      Buat Halaman Ini ✨
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
      className={`group flex h-9 min-w-0 max-w-[180px] shrink-0 items-center gap-2 rounded-t-lg px-3 text-sm transition ${isActive
          ? '-mb-px border-x border-t border-[#efeae6] bg-white font-medium text-[#111827]'
          : 'text-[#6b7280] hover:bg-white/60'
        }`}
    >
      <button onClick={onSelect} className="flex min-w-0 items-center gap-2">
        {isGenerating ? (
          <Loader2 size={14} className="animate-spin text-[#f05a32]" />
        ) : (
          <Icon size={15} strokeWidth={1.9} className={isActive ? 'text-[#f05a32]' : 'text-[#9aa2af]'} />
        )}
        <span className="truncate">{tab.label}</span>
      </button>
      <button
        aria-label={`Close ${tab.label}`}
        onClick={onClose}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[#9aa2af] opacity-0 transition hover:bg-black/5 hover:text-[#4b5563] group-hover:opacity-100"
      >
        <X size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}

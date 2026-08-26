'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Loader2,
  Palette,
  Plus,
  RotateCw,
  Sparkles,
  SquarePen,
  Store,
  Wand2,
  X,
} from 'lucide-react';
import { useBuilder } from './BuilderContext';

interface QuickSuggestion {
  id: string;
  label: string;
  prompt: string;
  keywords: string[];
  pageTypeNeeded?: string;
}

const ALL_QUICK_SUGGESTIONS: QuickSuggestion[] = [
  // Page creation (available if page not created yet)
  {
    id: 'page_product',
    label: '🧴 Generate Product Page',
    prompt: 'Generate a dedicated Product detail page with high-res image gallery, variant selectors, size guide, and sticky Add-to-Cart bar',
    keywords: ['product page', 'product detail', 'product template'],
    pageTypeNeeded: 'product',
  },
  {
    id: 'page_collection',
    label: '🛍️ Generate Collection Page',
    prompt: 'Generate a Collection catalog page with product grid, sorting dropdown, category badges, and price range filters',
    keywords: ['collection page', 'collection catalog', 'collection template'],
    pageTypeNeeded: 'collection',
  },
  {
    id: 'page_cart',
    label: '🛒 Generate Cart Page',
    prompt: 'Generate a dedicated Cart page with order summary, promo code input, free shipping progress bar, and checkout button',
    keywords: ['cart page', 'cart summary', 'checkout page'],
    pageTypeNeeded: 'cart',
  },
  // Social Proof & Trust
  {
    id: 'restore_header_brand',
    label: '🏷️ Restore Brand Name in Header',
    prompt: 'Restore the brand logo and store title in the header navigation with bold modern typography',
    keywords: ['restore brand', 'restore logo', 'header title'],
  },
  {
    id: 'reviews',
    label: '🌟 Add Customer Reviews',
    prompt: 'Add a customer reviews and testimonials slider section with 5-star ratings, buyer avatars, and verified purchase tags',
    keywords: ['review', 'testimonial', 'rating', '5-star'],
  },
  {
    id: 'faq',
    label: '❓ Add FAQ Accordion',
    prompt: 'Add a modern FAQ accordion section answering top 4 shipping, return, and product questions',
    keywords: ['faq', 'frequently asked', 'accordion', 'q&a'],
  },
  {
    id: 'trust_badges',
    label: '🛡️ Add Trust Badges',
    prompt: 'Add a trust badges bar featuring 30-Day Money-Back Guarantee, Secure Checkout, and Worldwide Shipping with clean icons',
    keywords: ['trust', 'guarantee', 'badge', 'security', 'secure checkout'],
  },
  {
    id: 'instagram_feed',
    label: '📸 Add Instagram Grid',
    prompt: 'Add a shoppable Instagram community gallery grid section with hover overlays and @mention handles',
    keywords: ['instagram', 'community', 'social grid', 'gallery feed'],
  },
  // Conversions & Sales
  {
    id: 'countdown',
    label: '⚡ Add Sale Countdown',
    prompt: 'Add an urgency flash sale banner with an animated countdown timer, discount coupon badge, and shop now button',
    keywords: ['countdown', 'flash sale', 'timer', 'urgency'],
  },
  {
    id: 'featured_grid',
    label: '✨ Add Featured Products Grid',
    prompt: 'Add a curated 4-item grid of trending featured products with quick view, price tags, and Add-to-Cart buttons',
    keywords: ['featured product', 'trending product', 'curated grid', 'best seller'],
  },
  {
    id: 'newsletter',
    label: '✉️ Add Newsletter Section',
    prompt: 'Add an elegant email newsletter subscription section offering 15% discount for first-time subscribers',
    keywords: ['newsletter', 'subscribe', 'email signup', 'discount hook'],
  },
  {
    id: 'comparison',
    label: '⚖️ Add Comparison Table',
    prompt: 'Add a feature comparison table section highlighting how our brand outperforms standard alternatives',
    keywords: ['comparison', 'compare', 'comparison table', 'vs'],
  },
  {
    id: 'video_hero',
    label: '🎬 Add Video Hero Section',
    prompt: 'Add a high-impact video background hero section with headline, subheading, and dual action buttons',
    keywords: ['video hero', 'video background', 'video banner'],
  },
  // Design Styles
  {
    id: 'dark_aesthetic',
    label: '🎨 Modern Dark Aesthetic',
    prompt: 'Update the design style to a sleek luxury dark theme with high contrast typography and golden accents',
    keywords: ['dark theme', 'dark aesthetic', 'dark mode', 'luxury dark'],
  },
  {
    id: 'vibrant_palette',
    label: '🌈 Vibrant & Bold Colors',
    prompt: 'Update the color palette with vibrant, energizing accent colors and bold high-contrast buttons',
    keywords: ['vibrant', 'bold colors', 'colorful', 'high contrast'],
  },
  {
    id: 'minimalist_nordic',
    label: '🤍 Clean Scandinavian Minimalist',
    prompt: 'Refine the entire layout into an ultra-clean Scandinavian minimalist style with soft neutral tones and spacious typography',
    keywords: ['scandinavian', 'minimalist', 'clean minimalist', 'spacious'],
  },
];

export default function EditorChatPanel() {
  const {
    messages,
    pages,
    activePageId,
    setActivePage,
    isStreaming,
    generatingPageId,
    currentStep,
    showCompletionNotification,
    dismissCompletionNotification,
    error,
    sendMessage,
    retryLast,
    newChat,
  } = useBuilder();

  const [draft, setDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usedActionIds, setUsedActionIds] = useState<string[]>([]);
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generatingPage = pages.find((p) => p.id === generatingPageId) ?? null;
  const readyPages = pages.filter((p) => p.status === 'ready' && p.html?.trim());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, generatingPageId, currentStep, showCompletionNotification]);

  const handleNewChat = () => {
    setUsedActionIds([]);
    setShuffleOffset(0);
    newChat();
  };

  function submit(customPrompt?: string, actionId?: string) {
    const textToSend = (customPrompt ?? draft).trim();
    if (!textToSend || isStreaming) return;
    if (actionId) {
      setUsedActionIds((prev) => [...prev, actionId]);
    }
    sendMessage(textToSend);
    if (!customPrompt) setDraft('');
  }

  function copyText(id: string, text: string) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Dynamically filter suggestions based on chat history, existing pages, and clicked actions
  const availableSuggestions = useMemo(() => {
    const combinedContent = [
      ...messages.map((m) => m.content.toLowerCase()),
      ...pages.map((p) => (p.html ? p.html.toLowerCase() : '')),
    ].join(' ');

    const existingPageTypes = new Set(pages.map((p) => p.type));

    return ALL_QUICK_SUGGESTIONS.filter((item) => {
      // Exclude if explicitly clicked/used
      if (usedActionIds.includes(item.id)) return false;

      // Exclude page generation if that page already exists in the builder
      if (item.pageTypeNeeded && existingPageTypes.has(item.pageTypeNeeded as any)) return false;

      // Exclude if keywords already detected in messages or generated page HTML
      const alreadyPresent = item.keywords.some((kw) => combinedContent.includes(kw));
      if (alreadyPresent) return false;

      return true;
    });
  }, [messages, pages, usedActionIds]);

  // Display a rotating batch of 5 suggestions
  const displayedSuggestions = useMemo(() => {
    if (availableSuggestions.length === 0) return [];
    const start = shuffleOffset % availableSuggestions.length;
    const cycled = [
      ...availableSuggestions.slice(start),
      ...availableSuggestions.slice(0, start),
    ];
    return cycled.slice(0, 5);
  }, [availableSuggestions, shuffleOffset]);

  // Calculate step index (1: planning, 2: theming, 3: generating/patching)
  const stepIndex =
    currentStep?.step === 'planning'
      ? 1
      : currentStep?.step === 'theming'
        ? 2
        : currentStep?.step === 'generating' || currentStep?.step === 'patching'
          ? 3
          : isStreaming
            ? 2
            : 0;

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-r border-[#ece6e2] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3.5 pt-4">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#ff6747] transition hover:bg-[#fff3ef]"
        >
          <Plus size={16} strokeWidth={2.4} />
          New chat
        </button>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#fff0eb] px-2.5 py-0.5 text-xs font-semibold text-[#ff6747]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#ff6747]" />
              Building
            </span>
          )}
          <button
            aria-label="New prompt"
            onClick={handleNewChat}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e8e2de] bg-white text-[#4b5563] transition hover:bg-[#fff8f5]"
          >
            <SquarePen size={15} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        <p className="text-xs font-semibold tracking-wider uppercase text-[#9aa2af]">Storefront Assistant</p>

        {messages.length === 0 && !isStreaming && (
          <div className="rounded-2xl border border-[#eee7e3] bg-[#faf8f6] p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-[#111827]">
              <Sparkles size={16} className="text-[#ff6747]" />
              AI Shopify Theme Creator
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#6b7280]">
              Describe your brand or product, and I&apos;ll generate a tailored Shopify theme with live preview, responsive sections, and exportable Liquid templates.
            </p>
          </div>
        )}

        {messages.map((message) => {
          if (message.role === 'user') {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#fff2ee] px-4 py-3 text-sm leading-relaxed text-[#111827] shadow-sm">
                  {message.content}
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="group relative flex gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#ff6747] to-[#ff8f73] text-white shadow-sm">
                <Sparkles size={14} fill="currentColor" strokeWidth={1.5} />
              </span>
              <div className="max-w-[85%] space-y-2">
                <div className="rounded-2xl rounded-tl-sm border border-[#eee7e3] bg-white px-4 py-3 text-sm leading-relaxed text-[#374151] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  {message.content ? (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 py-1 text-xs text-[#9aa2af]">
                      Thinking <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                    </span>
                  )}
                </div>

                {message.content && (
                  <div className="flex items-center gap-2 pl-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => copyText(message.id, message.content)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#9aa2af] transition hover:bg-[#f3f4f6] hover:text-[#4b5563]"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check size={11} className="text-[#35b86b]" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Building Card */}
        {isStreaming && (
          <div className="overflow-hidden rounded-2xl border border-[#ffded6] bg-[#fffaf8] p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#ff6747] text-white">
                  <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#ff6747]">
                  {currentStep?.step === 'planning'
                    ? '1. Store Blueprint'
                    : currentStep?.step === 'theming'
                      ? '2. Theme & Design System'
                      : currentStep?.step === 'patching'
                        ? '3. Applying Scoped Edit'
                        : '3. Generating Sections'}
                </span>
              </div>
              <span className="text-xs font-semibold text-[#ff6747]">
                {currentStep?.progress ? `${currentStep.progress}%` : 'Building…'}
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#fce5df]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff6747] to-[#ff8f73] transition-all duration-500 ease-out"
                style={{ width: `${Math.max(currentStep?.progress ?? 20, 15)}%` }}
              />
            </div>

            {/* Visual Step Checklist */}
            <div className="mt-3.5 grid grid-cols-3 gap-1.5 text-[11px] font-medium">
              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                  stepIndex >= 1 ? 'bg-[#ffeedb] text-[#c05621] font-semibold' : 'text-[#a0aec0]'
                }`}
              >
                <Layers size={12} />
                Plan
              </div>
              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                  stepIndex >= 2 ? 'bg-[#ffeedb] text-[#c05621] font-semibold' : 'text-[#a0aec0]'
                }`}
              >
                <Palette size={12} />
                Theme
              </div>
              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                  stepIndex >= 3 ? 'bg-[#ffeedb] text-[#c05621] font-semibold' : 'text-[#a0aec0]'
                }`}
              >
                <Wand2 size={12} />
                Sections
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#7c2d12]">
              {currentStep?.message || (generatingPage ? `Generating sections for ${generatingPage.label}…` : 'Creating theme structure…')}
            </p>
          </div>
        )}

        {/* Completion Card */}
        {showCompletionNotification && !isStreaming && readyPages.length > 0 && (
          <div className="relative rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] p-4 text-sm shadow-sm animate-in zoom-in-95 duration-300">
            <button
              onClick={dismissCompletionNotification}
              className="absolute right-3 top-3 text-[#9ca3af] hover:text-[#4b5563]"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 text-[#065f46]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#10b981] text-white">
                <Check size={14} strokeWidth={2.6} />
              </span>
              <span className="font-bold text-sm">Storefront Ready! 🎉</span>
            </div>
            <p className="mt-1.5 text-xs text-[#047857] leading-relaxed">
              Theme and pages generated successfully. You can preview, edit sections inline, or export the Liquid theme.
            </p>

            {/* Quick Page Jump Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {readyPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    activePageId === page.id
                      ? 'bg-[#10b981] text-white shadow-sm'
                      : 'bg-white border border-[#a7f3d0] text-[#065f46] hover:bg-[#ecfdf5]'
                  }`}
                >
                  <Store size={12} />
                  {page.label}
                  <ArrowRight size={10} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Card */}
        {error && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-[#f6d5cd] bg-[#fff4f1] p-3.5 text-sm text-[#b4432a]">
            <p className="leading-relaxed text-xs">{error}</p>
            <button
              type="button"
              onClick={retryLast}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#ff6747] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#f85b3a] disabled:opacity-50"
            >
              <RotateCw size={12} strokeWidth={2.2} />
              Retry Generation
            </button>
          </div>
        )}
      </div>

      {/* Quick Interactive Suggestions */}
      {!isStreaming && displayedSuggestions.length > 0 && (
        <div className="border-t border-[#f5f1ee] px-4 pt-2.5 pb-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa2af]">
              Quick Actions
            </p>
            {availableSuggestions.length > 5 && (
              <button
                type="button"
                onClick={() => setShuffleOffset((prev) => prev + 3)}
                className="flex items-center gap-1 text-[11px] font-medium text-[#ff6747] hover:text-[#f85b3a] transition"
                title="Show different suggestions"
              >
                <RotateCw size={10} />
                More ideas
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            {displayedSuggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => submit(item.prompt, item.id)}
                className="shrink-0 rounded-full border border-[#ece6e2] bg-[#faf8f6] px-2.5 py-1 text-[11px] font-medium text-[#4b5563] transition hover:border-[#ffcfc4] hover:bg-[#fff4f1] hover:text-[#ff6747] shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-[#f0ebe7] p-4">
        <div className="rounded-2xl border border-[#e8e2de] bg-white p-3 shadow-[0_10px_24px_rgba(31,41,55,0.05)] focus-within:border-[#ff9d85] focus-within:ring-2 focus-within:ring-[#ff6747]/10 transition">
          <textarea
            aria-label="Ask anything about your theme"
            placeholder={isStreaming ? 'Generating storefront…' : 'Ask to add a section, edit style, or generate a page…'}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={isStreaming}
            className="w-full resize-none border-0 bg-transparent px-1 py-1 text-sm text-[#111827] outline-none placeholder:text-[#9aa2af] disabled:opacity-60"
          />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#9aa2af]">
                Press <kbd className="rounded bg-[#f3f4f6] px-1 py-0.5 text-[10px] font-semibold text-[#6b7280]">Enter</kbd> to send
              </span>
            </div>
            <button
              aria-label="Send message"
              onClick={() => submit()}
              disabled={isStreaming || !draft.trim()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#ff6747] text-white shadow-[0_8px_16px_rgba(255,103,71,0.22)] transition hover:bg-[#f85b3a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStreaming ? (
                <Loader2 size={15} strokeWidth={2.2} className="animate-spin" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Dot({ delay = '0ms' }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#ff8f73]"
      style={{ animationDelay: delay }}
    />
  );
}

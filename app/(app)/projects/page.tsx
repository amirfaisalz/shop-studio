'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  ImageOff,
  Loader2,
  Plus,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth } from '@/components';
import { useSubscription } from '@/components/billing/SubscriptionProvider';
import { listProjects, createProject, ProjectLimitError, type Project } from '@/lib/projects';
import { ensureProjectThumbnail } from '@/lib/thumbnail';
import UpgradeDialog from '@/components/billing/UpgradeDialog';

type LoadState = 'loading' | 'ready' | 'error';

const toneOptions = [
  { label: '✨ Clean Minimalist', tone: 'clean and minimalist with generous whitespace, subtle borders, and sophisticated typography' },
  { label: '⚡ Bold & High-Contrast', tone: 'bold, high-contrast dark aesthetic with strong typography, sharp cards, and animated badges' },
  { label: '💎 Luxury Editorial', tone: 'luxury editorial aesthetic with serif headings, warm champagne accents, and elegant split layouts' },
  { label: '🌿 Warm & Organic', tone: 'warm and organic aesthetic with earthy tones, gentle rounded cards, and natural textures' },
];

const starterBlueprints = [
  {
    title: 'Aura Skincare Atelier',
    category: 'Beauty & Wellness',
    desc: 'Pastel aesthetic, clinical efficacy metrics, serum carousel, and customer reviews',
    emoji: '🧴',
    color: 'bg-[#FFF0EC] text-[#FF5840] border-[#FFE2DC]',
    prompt: 'Create a high-end luxury skincare storefront with pastel aesthetic, clinical proof stats, featured serum carousel, and reviews.',
  },
  {
    title: 'Kuro Cyber Streetwear',
    category: 'Fashion & Apparel',
    desc: 'Dark high-energy mode, oversized typography, lookbook grid, and drop countdown',
    emoji: '⚡',
    color: 'bg-[#F0E9FF] text-[#885CF8] border-[#E5DBFF]',
    prompt: 'Build a high-energy dark streetwear brand store with limited drop countdown, oversized typography, lookbook grid, and cart drawer.',
  },
  {
    title: 'Solstice Luxury Horology',
    category: 'Jewelry & Watches',
    desc: 'Minimalist editorial layout, sapphire crystal specs, split hero, and concierge drawer',
    emoji: '⌚',
    color: 'bg-[#FFF7E7] text-[#F59B14] border-[#FFECC7]',
    prompt: 'Design a luxury watch and timepiece Shopify store with high-contrast editorial minimalism, mechanical specs table, and VIP inquiry drawer.',
  },
  {
    title: 'Origin Micro-Roasters',
    category: 'Food & Beverage',
    desc: 'Flavor radar notes, roast level sliders, subscription builder, and bundle savings',
    emoji: '☕',
    color: 'bg-[#EAFFEF] text-[#22CC58] border-[#D1F7DB]',
    prompt: 'Create an artisan coffee roastery storefront with origin flavor notes tags, roast sliders, subscription builder, and bundle discounts.',
  },
];

/** Format an ISO timestamp as e.g. "Jul 21, 2026". */
function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { entitlement, refresh: refreshEntitlement } = useSubscription();

  const [projects, setProjects] = useState<Project[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Quick Generator State for Empty State
  const [prompt, setPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    (async () => {
      try {
        const rows = await listProjects();
        if (!active) return;
        setProjects(rows);
        setState('ready');

        // Backfill previews in background safely
        for (const project of rows) {
          if (!active) return;
          if (project.thumbnail_url) continue;
          try {
            const url = await ensureProjectThumbnail(project);
            if (!active) return;
            if (url) {
              setProjects((prev) =>
                prev.map((p) => (p.id === project.id ? { ...p, thumbnail_url: url } : p))
              );
            }
          } catch (thumbErr) {
            console.warn('[thumbnail] Backfill failed for project:', project.id, thumbErr);
          }
        }
      } catch (err) {
        if (active) {
          console.error('[projects] Failed to fetch projects:', err);
          setLoadError(err instanceof Error ? err.message : 'Failed to load projects from database.');
          setState('error');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const handleSelectTone = (opt: (typeof toneOptions)[number]) => {
    const isCurrentlySelected = selectedTone === opt.tone;

    if (isCurrentlySelected) {
      setSelectedTone(null);
      return;
    }

    setSelectedTone(opt.tone);

    const trimmed = prompt.trim();
    if (!trimmed) {
      setPrompt(`Create a modern Shopify storefront with ${opt.tone}.`);
    } else {
      let updated = trimmed;
      let replaced = false;

      for (const t of toneOptions) {
        if (updated.includes(t.tone)) {
          updated = updated.replace(t.tone, opt.tone);
          replaced = true;
          break;
        }
      }

      if (!replaced) {
        const styleRegex = /(?:[.,]\s*)?(?:Design [Ss]tyle|[Ss]tyle|[Vv]ibe):\s*[^.]+$/i;
        if (styleRegex.test(updated)) {
          updated = updated.replace(styleRegex, `. Design Style: ${opt.tone}`);
        } else {
          const cleanBase = updated.replace(/[.,\s]+$/, '');
          updated = `${cleanBase}. Design Style: ${opt.tone}.`;
        }
      }

      setPrompt(updated);
    }

    promptInputRef.current?.focus();
  };

  const handleStartProject = async (targetPrompt?: string) => {
    const raw = (targetPrompt || prompt).trim();
    if (!raw || submitting) return;

    if (entitlement && !entitlement.canCreateProject) {
      setUpgradeOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    const finalPrompt =
      selectedTone && !raw.toLowerCase().includes(selectedTone.toLowerCase())
        ? `${raw}. Design Style: ${selectedTone}`
        : raw;

    try {
      const project = await createProject(finalPrompt);
      router.push(`/editor/${project.id}`);
    } catch (err) {
      if (err instanceof ProjectLimitError) {
        setUpgradeOpen(true);
        void refreshEntitlement();
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.prompt && p.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#fffdfc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header Area */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5840]">
              <FolderOpen size={14} />
              <span>PROJECT DIRECTORY</span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0F1724]">Your Storefronts</h1>
            <p className="mt-1 text-sm text-[#4B5563]">
              Every Shopify theme you&apos;ve generated, ready to reopen, customize, and export.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {state === 'ready' && projects.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search storefronts…"
                  className="h-10 w-full rounded-xl border border-[#e2dcda] bg-white pl-9 pr-8 text-xs text-[#0F1724] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF5840]/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (projects.length === 0 && promptInputRef.current) {
                  promptInputRef.current.focus();
                  promptInputRef.current.scrollIntoView({ behavior: 'smooth' });
                } else {
                  router.push('/dashboard');
                }
              }}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#FF5840] px-4 text-xs font-bold text-white shadow-[0_10px_20px_rgba(255,88,64,0.2)] transition hover:bg-[#f84a30]"
            >
              <Plus size={15} strokeWidth={2.4} />
              New Storefront
            </button>
          </div>
        </header>

        {/* Loading State */}
        {state === 'loading' && (
          <div className="grid place-items-center py-28 text-[#6b7280]">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Loader2 size={20} className="animate-spin text-[#FF5840]" />
              Loading your projects…
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="grid place-items-center py-20 text-center">
            <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="mt-3 text-base font-bold text-red-900">
                Unable to Load Storefronts
              </h3>
              <p className="mt-1.5 text-xs text-red-700 leading-relaxed">
                {loadError || "We couldn't connect to the database to fetch your projects."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State: No Projects Yet */}
        {state === 'ready' && projects.length === 0 && (
          <div className="space-y-12">
            {/* Hero Interactive Studio Box */}
            <div className="relative overflow-hidden rounded-3xl border border-[#e8e2de] bg-gradient-to-b from-white via-[#fffbfa] to-[#fff5f2] p-8 sm:p-12 shadow-[0_20px_50px_rgba(15,23,36,0.05)]">
              {/* Decorative Subtle Background Elements */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#FF5840]/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#FF5840]/20 bg-[#FFF0EC] px-3.5 py-1 text-xs font-bold text-[#FF5840]">
                  <Sparkles size={14} />
                  <span>AI SHOPIFY THEME GENERATOR</span>
                </div>

                <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[#0F1724] leading-tight">
                  Design and export your first Shopify store in seconds.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  ShopStudio creates fully responsive Tailwind layouts, customizable Liquid sections, and theme settings ready to publish straight into Shopify Online Store 2.0.
                </p>

                {/* Quick Generator Box */}
                <div className="mt-8 rounded-2xl border border-[#e8e2de] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,36,0.04)]">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-1">Vibe:</span>
                    {toneOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSelectTone(opt)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          selectedTone === opt.tone
                            ? 'bg-[#0F1724] text-white shadow-sm'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Create a luxury organic matcha tea storefront with earthy green tones, origin ritual story section, whisking guide modal, and monthly subscription builder..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#e2dcda] bg-neutral-50/70 p-3.5 text-sm text-[#0F1724] placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5840]/30 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void handleStartProject();
                      }
                    }}
                  />

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-600">⌘ + Enter</span>
                      <span>Generates Home, Product, Collection &amp; Cart</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleStartProject()}
                      disabled={submitting || !prompt.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5840] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(255,88,64,0.25)] transition-all hover:bg-[#f84a30] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={15} className="animate-spin" />
                          Constructing Theme…
                        </span>
                      ) : (
                        <>
                          <span>Generate Shopify Storefront</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Curated Starter Blueprints */}
            <div>
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-[#0F1724]">Or Start From a Proven Blueprint</h3>
                  <p className="text-xs text-[#4B5563]">1-Click load curated e-commerce concepts designed for high conversion.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {starterBlueprints.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setPrompt(item.prompt);
                      promptInputRef.current?.focus();
                      promptInputRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group flex flex-col justify-between rounded-2xl border border-[#e8e2de] bg-white p-5 text-left shadow-[0_8px_20px_rgba(15,23,36,0.02)] transition-all duration-200 hover:-translate-y-1 hover:border-[#FF5840]/50 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`grid h-11 w-11 place-items-center rounded-xl text-2xl border ${item.color}`}>
                          {item.emoji}
                        </span>
                        <span className="text-xs font-bold text-[#FF5840] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Use <ArrowRight size={12} />
                        </span>
                      </div>
                      <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F1724]">{item.title}</h4>
                      <p className="mt-1.5 text-xs text-[#4B5563] leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] font-semibold text-neutral-400 flex items-center justify-between">
                      <span>4 Sections • 5 Pages</span>
                      <span className="font-bold text-[#FF5840]">Load Prompt</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* How It Works - 3 Pillars */}
            <div className="rounded-3xl border border-[#e8e2de] bg-white p-8">
              <div className="text-center max-w-xl mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#0F1724]">How It Works</h3>
                <p className="mt-1 text-xs text-[#4B5563]">
                  From natural language prompt to a production-ready Shopify store in 3 simple steps.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-start rounded-2xl bg-[#fffdfc] p-6 border border-[#f0eae6]">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF0EC] text-[#FF5840] font-bold text-sm">
                    01
                  </span>
                  <h4 className="mt-4 text-sm font-bold text-[#0F1724] flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FF5840]" /> Prompt to Storefront
                  </h4>
                  <p className="mt-2 text-xs text-[#4B5563] leading-relaxed">
                    AI analyzes your niche, generates responsive layouts, curated color palettes, and full product showcases with real-time streaming preview.
                  </p>
                </div>

                <div className="flex flex-col items-start rounded-2xl bg-[#fffdfc] p-6 border border-[#f0eae6]">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F0E9FF] text-[#885CF8] font-bold text-sm">
                    02
                  </span>
                  <h4 className="mt-4 text-sm font-bold text-[#0F1724] flex items-center gap-2">
                    <Sliders size={16} className="text-[#885CF8]" /> Visual Inline Studio
                  </h4>
                  <p className="mt-2 text-xs text-[#4B5563] leading-relaxed">
                    Select any section or heading directly in the sandbox iframe. Request AI refinements, swap imagery via ImageKit, or adjust styling on the fly.
                  </p>
                </div>

                <div className="flex flex-col items-start rounded-2xl bg-[#fffdfc] p-6 border border-[#f0eae6]">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAFFEF] text-[#22CC58] font-bold text-sm">
                    03
                  </span>
                  <h4 className="mt-4 text-sm font-bold text-[#0F1724] flex items-center gap-2">
                    <Download size={16} className="text-[#22CC58]" /> 1-Click Shopify Export
                  </h4>
                  <p className="mt-2 text-xs text-[#4B5563] leading-relaxed">
                    Convert your designs to 100% compliant Shopify Liquid sections, schemas, and JSON templates. Download the ZIP and upload directly to Shopify Admin.
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-[#f0eae6] flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-[#4B5563]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#22CC58]" />
                  <span>Shopify Online Store 2.0 Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#22CC58]" />
                  <span>Zero Vendor Lock-in (Standard ZIP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#22CC58]" />
                  <span>ImageKit AI Asset Transformations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#22CC58]" />
                  <span>Mobile &amp; Desktop Optimized</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty Search Results State */}
        {state === 'ready' && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[#e2dcda] bg-white py-16 px-6 text-center">
            <div className="flex flex-col items-center gap-3 max-w-sm">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                <Search size={22} />
              </span>
              <h3 className="text-base font-bold text-[#0F1724]">No storefronts found</h3>
              <p className="text-xs text-[#4B5563]">
                No projects matched your search query &quot;<strong>{searchQuery}</strong>&quot;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-[#0F1724] hover:bg-neutral-200"
              >
                Clear Search Filter
              </button>
            </div>
          </div>
        )}

        {/* Ready State with Projects */}
        {state === 'ready' && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Project limit reached"
        description="The Free plan includes 2 projects. Upgrade to Pro to create unlimited storefronts and download theme ZIP packages."
      />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/editor/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#eee7e3] bg-white shadow-[0_10px_24px_rgba(31,41,55,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ffd4c7] hover:shadow-[0_16px_32px_rgba(31,41,55,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f6f2ef]">
        {project.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote InsForge Storage URL, not optimizable at build time.
          <img
            src={project.thumbnail_url}
            alt={`${project.name} preview`}
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[#c3bcb6]">
            <div className="flex flex-col items-center gap-2">
              <ImageOff size={24} strokeWidth={1.6} />
              <span className="text-xs font-medium">Ready in Editor</span>
            </div>
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
          Shopify OS 2.0
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-[#111827] group-hover:text-[#FF5840] transition-colors">
          {project.name}
        </h3>
        <p className="mt-1 text-xs text-[#6b7280] line-clamp-2 leading-relaxed">
          {project.prompt || 'Custom Shopify Theme generated by ShopStudio'}
        </p>
        <div className="mt-auto pt-3 flex items-center justify-between text-[11px] font-medium text-[#9aa2af] border-t border-[#f6f2ef]">
          <span>Created {formatCreatedAt(project.created_at)}</span>
          <span className="font-semibold text-[#FF5840] flex items-center gap-1">
            Open Editor <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

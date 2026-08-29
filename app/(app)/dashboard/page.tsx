'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  FolderOpen,
  Plus,
  Loader2,
  Crown,
  Download,
  CheckCircle2,
  ImageOff,
  Search,
  Flame,
  Code2,
  X,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/components';
import { useSubscription } from '@/components/billing/SubscriptionProvider';
import { listProjects, createProject, ProjectLimitError, type Project } from '@/lib/projects';
import { ensureProjectThumbnail } from '@/lib/thumbnail';
import UpgradeDialog from '@/components/billing/UpgradeDialog';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';
import { FREE_PROJECT_LIMIT } from '@/lib/billing/plans';
import AIModelSelector from '@/components/editor/AIModelSelector';
import { type AIClientConfig, DEFAULT_AI_CONFIG } from '@/lib/ai/models';

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
    color: 'bg-[#FFF3EE] text-[#FF3B00] border-[#FFCCBC]',
    prompt: 'Create a high-end luxury skincare storefront with pastel aesthetic, clinical proof stats, featured serum carousel, and reviews.',
  },
  {
    title: 'Kuro Cyber Streetwear',
    category: 'Fashion & Apparel',
    desc: 'Dark high-energy mode, oversized typography, lookbook grid, and drop countdown',
    emoji: '⚡',
    color: 'bg-[#F0E9FF] text-[#8B5CF6] border-[#DDD6FE]',
    prompt: 'Build a high-energy dark streetwear brand store with limited drop countdown, oversized typography, lookbook grid, and cart drawer.',
  },
  {
    title: 'Solstice Luxury Horology',
    category: 'Jewelry & Watches',
    desc: 'Minimalist editorial layout, sapphire crystal specs, split hero, and concierge drawer',
    emoji: '⌚',
    color: 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]',
    prompt: 'Design a luxury watch and timepiece Shopify store with high-contrast editorial minimalism, mechanical specs table, and VIP inquiry drawer.',
  },
  {
    title: 'Origin Micro-Roasters',
    category: 'Food & Beverage',
    desc: 'Flavor radar notes, roast level sliders, subscription builder, and bundle savings',
    emoji: '☕',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]',
    prompt: 'Create an artisan coffee roastery storefront with origin flavor notes tags, roast sliders, subscription builder, and bundle discounts.',
  },
];

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { entitlement, refresh: refreshEntitlement } = useSubscription();

  const [prompt, setPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiConfig, setAiConfig] = useState<AIClientConfig>(DEFAULT_AI_CONFIG);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('shopstudio_ai_config');
        if (saved && active) {
          const parsed = JSON.parse(saved) as AIClientConfig;
          if (parsed && typeof parsed === 'object') {
            setAiConfig(parsed);
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

  const handleAiConfigChange = (newConfig: AIClientConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem('shopstudio_ai_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    (async () => {
      try {
        const rows = await listProjects();
        if (!active) return;
        setProjects(rows);
        setLoadingProjects(false);

        // Background thumbnail generation
        for (const project of rows) {
          if (!active) return;
          if (project.thumbnail_url) continue;
          const url = await ensureProjectThumbnail(project);
          if (!active) return;
          if (url) {
            setProjects((prev) =>
              prev.map((p) => (p.id === project.id ? { ...p, thumbnail_url: url } : p))
            );
          }
        }
      } catch {
        if (active) setLoadingProjects(false);
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
      try {
        localStorage.setItem('shopstudio_ai_config', JSON.stringify(aiConfig));
      } catch {}
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

  const isPaid = entitlement?.isPaid ?? false;
  const projectCount = projects.length;
  const maxProjects = entitlement?.maxProjects ?? FREE_PROJECT_LIMIT;
  const usagePct = isPaid || !maxProjects ? 100 : Math.min(100, Math.round((projectCount / maxProjects) * 100));

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.prompt && p.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#fffdfc] px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Top Greeting & Plan Status Bar */}
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-neutral-200/80 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF3B00]">
              <Flame size={14} className="fill-[#FF3B00]" />
              <span>THEME CREATION STUDIO</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'Merchant'} 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Generate, customize, and export high-converting Shopify Online Store 2.0 themes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-[#FFF8EE] px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-2xs">
                <Crown size={14} className="text-amber-600" /> Pro Plan Active
              </span>
            ) : (
              <Link
                href="/billing"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFCCBC] bg-[#FFF3EE] px-3.5 py-2 text-xs font-bold text-[#FF3B00] transition-all hover:bg-[#FFE5DE] shadow-2xs"
              >
                <Crown size={14} /> Upgrade to Pro
              </Link>
            )}
            <button
              onClick={() => {
                promptInputRef.current?.focus();
                promptInputRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-4 py-2 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition-all hover:brightness-105 hover:shadow-[0_4px_16px_rgba(255,59,0,0.4)] cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.4} />
              <span>New Storefront</span>
            </button>
          </div>
        </header>

        {/* Quick Stats Overview (4 Bento Cards) */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-neutral-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Themes</p>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                <FolderOpen size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-neutral-950">{projectCount}</p>
            <p className="mt-1 text-xs text-neutral-500 font-medium">Generated storefronts</p>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-neutral-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Plan Quota</p>
              {isPaid ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Unlimited
                </span>
              ) : (
                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                  Free Tier
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-black text-neutral-950">
              {projectCount} <span className="text-sm font-semibold text-neutral-400">/ {isPaid ? '∞' : maxProjects}</span>
            </p>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] rounded-full transition-all duration-300"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-neutral-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Shopify OS 2.0</p>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                <Code2 size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xl font-bold text-neutral-950">100% Valid</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500 font-medium">Liquid + JSON Schemas</p>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-neutral-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Theme ZIP Export</p>
              <span className={`grid h-8 w-8 place-items-center rounded-xl border ${
                entitlement?.canExport ? 'bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE]' : 'bg-neutral-100 text-neutral-400 border-neutral-200'
              }`}>
                <Download size={16} />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xl font-bold text-neutral-950">
                {entitlement?.canExport ? 'Ready' : 'Pro Feature'}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500 font-medium">1-Click Admin Upload</p>
          </div>
        </section>

        {/* AI Prompt Studio Studio Box */}
        <section className="mb-10 rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF3EE] text-[#FF3B00]">
                  <Sparkles size={16} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-950">AI Storefront Generator</h2>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Describe a brand concept to generate responsive Liquid sections, schemas, and layouts in real time.
              </p>
            </div>

            {/* Target Pages Breakdown Pills */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-neutral-600">
              <span className="rounded-md bg-neutral-100 px-2 py-0.5">Home</span>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5">Product</span>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5">Collection</span>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5">Cart</span>
            </div>
          </div>

          {/* Tone Selector & AI Model Selector Row */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1">Design Vibe:</span>
              {toneOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelectTone(opt)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    selectedTone === opt.tone
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider hidden sm:inline">Model:</span>
              <AIModelSelector
                config={aiConfig}
                onChange={handleAiConfigChange}
                disabled={submitting}
                placement="bottom"
                align="right"
              />
            </div>
          </div>

          {/* Prompt Form */}
          <div className="relative">
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a luxury organic matcha tea storefront with earthy green tones, origin ritual story section, whisking guide modal, and monthly subscription builder..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 text-xs sm:text-sm text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30 transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleStartProject();
                }
              }}
            />

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-700 font-bold">⌘ + Enter</span>
                <span>to generate • Includes 5 Core Storefront Pages</span>
              </div>

              <button
                type="button"
                onClick={() => void handleStartProject()}
                disabled={submitting || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,59,0,0.3)] transition-all hover:brightness-105 hover:shadow-[0_6px_20px_rgba(255,59,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Constructing Theme…
                  </span>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate Shopify Storefront</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {error}
            </p>
          )}
        </section>

        {/* Curated Starter Blueprints */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-950">Curated Blueprints</h2>
              <p className="text-xs text-neutral-500">1-Click start from proven e-commerce templates designed for high conversion.</p>
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
                className="group flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#FF5722]/50 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl text-xl border ${item.color}`}>
                      {item.emoji}
                    </span>
                    <span className="text-xs font-bold text-[#FF3B00] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Use <ArrowRight size={12} />
                    </span>
                  </div>
                  <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-950">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] font-semibold text-neutral-400 flex items-center justify-between">
                  <span>4 Sections • 5 Pages</span>
                  <span className="font-bold text-[#FF3B00]">Load Prompt</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Projects Grid & Search */}
        <section className="mb-10">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-950">Your Storefronts</h2>
              <p className="text-xs text-neutral-500">Manage, preview, and edit your generated Shopify themes.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search storefronts…"
                  className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-8 text-xs text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30"
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
              <Link
                href="/projects"
                className="shrink-0 text-xs font-bold text-[#FF3B00] hover:underline"
              >
                View all ({projects.length})
              </Link>
            </div>
          </div>

          {loadingProjects ? (
            <div className="grid place-items-center py-16 text-neutral-400">
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <Loader2 size={18} className="animate-spin text-[#FF3B00]" />
                Loading your themes…
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-neutral-200 bg-white py-14 px-6 text-center">
              <div className="flex flex-col items-center gap-3 max-w-sm">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                  <FolderOpen size={24} />
                </span>
                <h3 className="text-base font-bold text-neutral-950">No themes created yet</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Enter a prompt in the AI Storefront Generator above or pick a blueprint to build your first Shopify store.
                </p>
                <button
                  type="button"
                  onClick={() => promptInputRef.current?.focus()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Start First Store</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#FF5722]/50 hover:shadow-md"
                >
                  <Link href={`/editor/${project.id}`} className="block relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                    {project.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnail_url}
                        alt={`${project.name} preview`}
                        className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-neutral-400">
                        <div className="flex flex-col items-center gap-1.5">
                          <ImageOff size={22} />
                          <span className="text-[11px] font-medium">Ready in Editor</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 rounded-md bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
                      Shopify OS 2.0
                    </div>
                  </Link>

                  <button
                    type="button"
                    title="Delete storefront"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingProject(project);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 grid h-7 w-7 place-items-center rounded-lg bg-neutral-950/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    <Trash2 size={13} />
                  </button>

                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/editor/${project.id}`} className="block">
                      <h3 className="text-sm font-bold text-neutral-950 group-hover:text-[#FF3B00] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {project.prompt || 'Custom Shopify Theme generated by ShopStudio'}
                      </p>
                    </Link>
                    <div className="mt-auto pt-3 flex items-center justify-between text-[11px] font-medium text-neutral-400 border-t border-neutral-100">
                      <span>Created {formatCreatedAt(project.created_at)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingProject(project);
                          }}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1 -m-1 cursor-pointer"
                          title="Delete storefront"
                        >
                          <Trash2 size={13} />
                        </button>
                        <Link
                          href={`/editor/${project.id}`}
                          className="font-bold text-[#FF3B00] flex items-center gap-1 hover:underline"
                        >
                          Open Editor <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Publishing Guide Checklist */}
        <section className="rounded-2xl border border-emerald-200 bg-[#F0FDF4] p-6 shadow-2xs">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">How to Publish Your Theme to Shopify</h3>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                1. Open any theme in the Editor and click <strong>Export to Shopify &gt; Download ZIP</strong>.<br />
                2. Go to your <strong>Shopify Admin &gt; Online Store &gt; Themes</strong>.<br />
                3. Click <strong>Add Theme &gt; Upload zip file</strong> and select your downloaded archive.
              </p>
            </div>
          </div>
        </section>
      </div>

      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Project limit reached"
        description="The Free plan includes 2 projects. Upgrade to Pro to create unlimited storefronts and download theme ZIP packages."
      />

      {deletingProject && (
        <DeleteProjectDialog
          open={!!deletingProject}
          onClose={() => setDeletingProject(null)}
          projectId={deletingProject.id}
          projectName={deletingProject.name}
          onDeleted={(id) => {
            setProjects((prev) => prev.filter((p) => p.id !== id));
            void refreshEntitlement();
          }}
        />
      )}
    </div>
  );
}


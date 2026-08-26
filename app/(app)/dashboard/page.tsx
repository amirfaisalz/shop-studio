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
} from 'lucide-react';
import { useAuth } from '@/components';
import { useSubscription } from '@/components/billing/SubscriptionProvider';
import { listProjects, createProject, ProjectLimitError, type Project } from '@/lib/projects';
import { ensureProjectThumbnail } from '@/lib/thumbnail';
import UpgradeDialog from '@/components/billing/UpgradeDialog';
import { FREE_PROJECT_LIMIT } from '@/lib/billing/plans';

const toneOptions = [
  { label: '✨ Clean Minimalist', tone: 'clean and minimalist with generous whitespace, subtle borders, and sophisticated typography' },
  { label: '⚡ Bold & High-Contrast', tone: 'bold, high-contrast dark aesthetic with strong typography, sharp cards, and animated badges' },
  { label: '💎 Luxury Editorial', tone: 'luxury editorial aesthetic with serif headings, warm champagne accents, and elegant split layouts' },
  { label: '🌿 Warm & Organic', tone: 'warm and organic aesthetic with earthy tones, gentle rounded cards, and natural textures' },
];

const starterBlueprints = [
  {
    title: 'Aura Skincare Atelier',
    desc: 'Pastel aesthetic, clinical efficacy metrics, serum carousel, customer reviews',
    emoji: '🧴',
    color: 'bg-[#FFF0EC] text-[#FF5840] border-[#FFE2DC]',
    prompt: 'Create a high-end luxury skincare storefront with pastel aesthetic, clinical proof stats, featured serum carousel, and reviews.',
  },
  {
    title: 'Kuro Cyber Streetwear',
    desc: 'Dark high-energy mode, oversized typography, lookbook grid, drop countdown',
    emoji: '⚡',
    color: 'bg-[#F0E9FF] text-[#885CF8] border-[#E5DBFF]',
    prompt: 'Build a high-energy dark streetwear brand store with limited drop countdown, oversized typography, lookbook grid, and cart drawer.',
  },
  {
    title: 'Solstice Luxury Horology',
    desc: 'Minimalist editorial layout, sapphire crystal specs, split hero, concierge drawer',
    emoji: '⌚',
    color: 'bg-[#FFF7E7] text-[#F59B14] border-[#FFECC7]',
    prompt: 'Design a luxury watch and timepiece Shopify store with high-contrast editorial minimalism, mechanical specs table, and VIP inquiry drawer.',
  },
  {
    title: 'Origin Micro-Roasters',
    desc: 'Flavor radar notes, roast level sliders, subscription builder, bundle savings',
    emoji: '☕',
    color: 'bg-[#EAFFEF] text-[#22CC58] border-[#D1F7DB]',
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

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

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
    <div className="min-h-screen bg-[#fffdfc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Top Greeting & Plan Status Bar */}
        <header className="mb-10 flex flex-col justify-between gap-4 border-b border-[#f0eae6] pb-8 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5840]">
              <Sparkles size={14} />
              <span>THEME CREATION STUDIO</span>
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0F1724]">
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'Merchant'} 👋
            </h1>
            <p className="mt-1 text-sm text-[#4B5563]">
              Generate, customize, and export high-converting Shopify Online Store 2.0 themes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-xs">
                <Crown size={14} className="text-amber-600" /> Pro Plan Active
              </span>
            ) : (
              <Link
                href="/billing"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF5840]/30 bg-[#FFF0EC] px-4 py-2 text-xs font-bold text-[#FF5840] transition-all hover:bg-[#FFE5DE]"
              >
                <Crown size={14} /> Upgrade to Pro
              </Link>
            )}
            <button
              onClick={() => {
                promptInputRef.current?.focus();
                promptInputRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F1724] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#FF5840]"
            >
              <Plus size={15} />
              New Storefront
            </button>
          </div>
        </header>

        {/* Quick Stats Overview */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e8e2de] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,36,0.02)]">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Projects</p>
            <p className="mt-2 text-2xl font-black text-[#0F1724]">{projectCount}</p>
            <p className="mt-1 text-xs text-neutral-500">Storefronts generated</p>
          </div>

          <div className="rounded-2xl border border-[#e8e2de] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,36,0.02)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Plan Quota</p>
              {isPaid && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Unlimited</span>
              )}
            </div>
            <p className="mt-2 text-2xl font-black text-[#0F1724]">
              {projectCount} <span className="text-sm font-medium text-neutral-400">/ {isPaid ? '∞' : maxProjects}</span>
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full bg-[#FF5840] rounded-full" style={{ width: `${usagePct}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8e2de] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,36,0.02)]">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Shopify OS 2.0</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22CC58] animate-pulse" />
              <span className="text-xl font-bold text-[#0F1724]">100% Valid</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">Liquid + JSON schema</p>
          </div>

          <div className="rounded-2xl border border-[#e8e2de] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,36,0.02)]">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">ZIP Export</p>
            <div className="mt-2 flex items-center gap-1.5">
              <Download size={18} className={entitlement?.canExport ? 'text-[#22CC58]' : 'text-neutral-400'} />
              <span className="text-xl font-bold text-[#0F1724]">
                {entitlement?.canExport ? 'Enabled' : 'Pro Feature'}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">1-click admin upload</p>
          </div>
        </section>

        {/* AI Prompt Studio Studio Box */}
        <section className="mb-12 rounded-3xl border border-[#e8e2de] bg-white p-6 sm:p-8 shadow-[0_18px_45px_rgba(15,23,36,0.05)]">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[#0F1724] flex items-center gap-2">
                <Sparkles size={20} className="text-[#FF5840]" /> AI Storefront Generator
              </h2>
              <p className="text-xs text-[#4B5563] mt-0.5">
                Describe a brand or store concept to generate complete Liquid sections and layouts.
              </p>
            </div>
          </div>

          {/* Tone Selector Chips */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1">Design Vibe:</span>
            {toneOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleSelectTone(opt)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  selectedTone === opt.tone
                    ? 'bg-[#0F1724] text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Prompt Form */}
          <div className="relative">
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a luxury organic matcha tea storefront with earthy green tones, origin ritual story section, whisking guide modal, and monthly subscription builder..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#e2dcda] bg-neutral-50/60 p-4 text-sm text-[#0F1724] placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5840]/30 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleStartProject();
                }
              }}
            />

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-600">⌘ + Enter</span>
                <span>to generate • Includes Home, Product, Collection &amp; Cart</span>
              </div>

              <button
                type="button"
                onClick={() => void handleStartProject()}
                disabled={submitting || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5840] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,88,64,0.25)] transition-all hover:bg-[#f84a30] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Constructing Theme…
                  </span>
                ) : (
                  <>
                    <span>Generate Shopify Storefront</span>
                    <ArrowRight size={16} />
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
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F1724]">Curated Blueprints</h2>
              <p className="text-xs text-[#4B5563]">1-Click start from proven e-commerce templates.</p>
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
                  <h3 className="mt-3 text-sm font-bold text-[#0F1724]">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-[#4B5563] leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] font-semibold text-neutral-400">
                  4 Sections • 5 Pages
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Projects Grid & Search */}
        <section className="mb-12">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-[#0F1724]">Your Storefronts</h2>
              <p className="text-xs text-[#4B5563]">Manage and edit your generated Shopify themes.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search storefronts…"
                  className="h-9 w-full rounded-xl border border-[#e2dcda] bg-white pl-9 pr-3 text-xs text-[#0F1724] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF5840]/30"
                />
              </div>
              <Link
                href="/projects"
                className="shrink-0 text-xs font-bold text-[#FF5840] hover:underline"
              >
                View all ({projects.length})
              </Link>
            </div>
          </div>

          {loadingProjects ? (
            <div className="grid place-items-center py-20 text-neutral-400">
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <Loader2 size={18} className="animate-spin text-[#FF5840]" />
                Loading your themes…
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-[#e2dcda] bg-white py-16 px-6 text-center">
              <div className="flex flex-col items-center gap-3 max-w-sm">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF0EC] text-[#FF5840]">
                  <FolderOpen size={26} />
                </span>
                <h3 className="text-base font-bold text-[#0F1724]">No themes created yet</h3>
                <p className="text-xs text-[#4B5563]">
                  Enter a prompt in the AI Storefront Generator above or pick a blueprint to build your first Shopify store.
                </p>
                <button
                  type="button"
                  onClick={() => promptInputRef.current?.focus()}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#FF5840] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#f84a30]"
                >
                  <Plus size={14} /> Start First Store
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#e8e2de] bg-white shadow-[0_8px_20px_rgba(15,23,36,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF5840]/40 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f6f2ef]">
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
                    <div className="absolute top-2.5 right-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                      Shopify OS 2.0
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-bold text-[#0F1724] group-hover:text-[#FF5840] transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                      {project.prompt || 'Custom Shopify Theme generated by AI Theme Builder'}
                    </p>
                    <div className="mt-auto pt-3 flex items-center justify-between text-[11px] font-medium text-neutral-400 border-t border-neutral-100">
                      <span>Created {formatCreatedAt(project.created_at)}</span>
                      <span className="font-semibold text-[#FF5840] flex items-center gap-1">
                        Open Editor <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Publishing Guide Checklist */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">How to Publish Your Theme to Shopify</h3>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                1. Open any theme in the Editor and click <strong>Export Theme ZIP</strong>.<br />
                2. Go to your <strong>Shopify Admin &gt; Online Store &gt; Themes</strong>.<br />
                3. Click <strong>Add Theme &gt; Upload zip file</strong> and select your exported package.
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  Monitor,
  Smartphone,
  Code2,
  Eye,
  FolderArchive,
  Copy,
  Check,
  Layers,
  Wand2,
  CheckCheck,
  Menu,
  Star,
  ShieldCheck,
  Zap,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components';
import { createProject } from '@/lib/projects';
import BigSquaresBackground from './BigSquaresBackground';

type ModeTab = 'generate' | 'edit' | 'export' | 'media';

export default function LandingHero() {
  const router = useRouter();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState(
    'Create a high-end luxury skincare storefront named Aura Atelier with soothing pastel tones, clinical trial proof badges, glowing product spotlight, and a slideout cart.'
  );
  const [activeMode, setActiveMode] = useState<ModeTab>('generate');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'preview' | 'liquid' | 'structure'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const modePresets: Record<ModeTab, { title: string; prompt: string; icon: LucideIcon }> = {
    generate: {
      title: 'Generate Theme',
      prompt: 'Create a high-end luxury skincare storefront named Aura Atelier with soothing pastel tones, clinical trial proof badges, glowing product spotlight, and a slideout cart.',
      icon: Sparkles,
    },
    edit: {
      title: 'Visual Edit',
      prompt: 'Change the hero heading to "Bioactive Botanical Radiance" and make the primary call-to-action button vibrant coral with pulse effect.',
      icon: Wand2,
    },
    export: {
      title: 'Liquid Export',
      prompt: 'Compile full theme into Shopify OS 2.0 standard layout, JSON templates, customizable sections with {% schema %}, and locales.',
      icon: Code2,
    },
    media: {
      title: 'Smart Media',
      prompt: 'Generate photorealistic lifestyle product shots with ImageKit automatic WebP/AVIF transformations and global CDN delivery.',
      icon: Layers,
    },
  };

  const handleSelectMode = (mode: ModeTab) => {
    setActiveMode(mode);
    setPrompt(modePresets[mode].prompt);
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent('/dashboard')}`);
      return;
    }

    setIsGenerating(true);
    try {
      const project = await createProject(prompt);
      router.push(`/editor/${project.id}`);
    } catch {
      router.push('/dashboard');
    } finally {
      setIsGenerating(false);
    }
  };

  const liquidSnippet = `{% comment %}
  Shopify OS 2.0 Section: hero-banner.liquid
  Generated with ShopStudio AI Theme Builder
{% endcomment %}

<section 
  id="shopify-section-{{ section.id }}" 
  class="relative overflow-hidden py-16 md:py-24 bg-white"
>
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <div class="space-y-6">
        <span class="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 border border-orange-200">
          {{ section.settings.badge_text }}
        </span>
        <h1 class="text-4xl font-extrabold tracking-tight sm:text-6xl text-neutral-900 leading-tight">
          {{ section.settings.heading }}
        </h1>
        <p class="text-base text-neutral-600 leading-relaxed">
          {{ section.settings.subheading }}
        </p>
        <div class="flex flex-wrap gap-4 pt-2">
          <a href="{{ section.settings.primary_url }}" class="rounded-xl bg-[#FF4500] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#E03E00]">
            {{ section.settings.primary_cta }}
          </a>
        </div>
      </div>
      <div class="relative aspect-square overflow-hidden rounded-3xl shadow-xl">
        <img 
          src="{{ section.settings.image | image_url: width: 1200 }}" 
          alt="{{ section.settings.heading | escape }}" 
          class="h-full w-full object-cover" 
        />
      </div>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Hero Banner",
  "tag": "section",
  "class": "section-hero",
  "settings": [
    {
      "type": "text",
      "id": "badge_text",
      "label": "Badge Text",
      "default": "SPRING 2026 CLINICAL RELEASE"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Botanical Radiance Meets Cellular Science"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Subheading",
      "default": "Formulated with cold-pressed bioactive botanicals to restore your skin barrier."
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Hero Image"
    }
  ],
  "presets": [
    {
      "name": "Default Hero Banner"
    }
  ]
}
{% endschema %}`;

  const copyCode = () => {
    navigator.clipboard.writeText(liquidSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="relative overflow-hidden bg-white text-neutral-950 pt-6 pb-20 border-b border-neutral-200/80">
      {/* Impeccable Big Squares Animated Background */}
      <BigSquaresBackground showTechLabels={true} maskVariant="center" density="normal" seedOffset={42} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
        {/* Top Announcement Pill */}
        <div className="flex justify-center px-2">
          <a
            href="#showcase"
            className="group inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white/80 px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-700 shadow-xs backdrop-blur-md transition-all hover:border-[#FF4500]/50 hover:bg-[#FFF5F2] hover:shadow-sm max-w-full text-center"
          >
            <span className="shrink-0 rounded-full bg-gradient-to-r from-[#FF3B00] to-[#FF5E00] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              OS 2.0
            </span>
            <span className="truncate sm:whitespace-normal group-hover:text-neutral-950 transition-colors">
              Turn Prompts into Production-Ready Themes
            </span>
            <ArrowRight size={12} className="shrink-0 text-neutral-400 group-hover:text-[#FF4500] group-hover:translate-x-0.5 transition-all" />
          </a>
        </div>

        {/* Hero Main Headline & Subhead (Clean, Open & Borderless) */}
        <div className="relative mx-auto mt-7 sm:mt-9 max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.12] sm:leading-[1.08] text-neutral-950">
            Power Shopify stores <br className="hidden sm:inline" />
            with <span className="bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] bg-clip-text text-transparent">clean Liquid code</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base md:text-lg text-neutral-600 leading-relaxed font-normal">
            The AI engine to generate, edit, and export complete Shopify Online Store 2.0 themes with valid Liquid sections, customizable schemas, and 1-click ZIP export.
          </p>

          {/* Top CTA Actions */}
          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-6 py-3.5 sm:py-3 text-xs font-bold text-white shadow-[0_4px_16px_rgba(255,59,0,0.32)] transition-all hover:brightness-105 hover:shadow-[0_6px_22px_rgba(255,59,0,0.45)] hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Start for free</span>
              <ArrowRight size={14} />
            </button>
            <a
              href="#playground"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200/90 bg-white/90 px-5 py-3.5 sm:py-3 text-xs font-bold text-neutral-800 shadow-xs backdrop-blur-sm transition-all hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-0.5"
            >
              <Code2 size={14} className="text-neutral-500" />
              <span>Explore Playground</span>
            </a>
          </div>
        </div>

        {/* Firecrawl-Style Floating Command & Prompt Bar */}
        <div className="mx-auto mt-10 sm:mt-14 max-w-3xl rounded-2xl border border-neutral-200/90 bg-white/95 p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl ring-1 ring-neutral-900/5">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-neutral-100 px-1 sm:px-2 pb-2.5 sm:flex-wrap">
            {(Object.keys(modePresets) as ModeTab[]).map((mode) => {
              const item = modePresets[mode];
              const IconComp = item.icon;
              const isSelected = activeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelectMode(mode)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                  }`}
                >
                  <IconComp size={13} className={isSelected ? 'text-[#FF8A65]' : 'text-neutral-400'} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* Prompt Input Row */}
          <div className="flex items-center gap-2 px-2 pt-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGenerating && prompt.trim()) {
                    handleGenerate();
                  }
                }}
                placeholder="Describe your Shopify store aesthetic, target audience, brand colors..."
                className="w-full rounded-xl bg-transparent py-2.5 pl-2 pr-4 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF5E00] text-white shadow-xs transition-all hover:brightness-105 hover:shadow-md disabled:opacity-50 cursor-pointer"
              title="Generate Theme (Enter)"
            >
              {isGenerating ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Firecrawl Interactive Split Wireframe & Code Playground */}
        <div id="playground" className="mt-12 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          {/* Top Browser Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 bg-neutral-50/90 px-5 py-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-mono text-neutral-600">
                <span className="text-neutral-400">https://</span>
                <span className="font-semibold text-neutral-800">aura-atelier.myshopify.com</span>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-neutral-200/60 p-1">
              <button
                type="button"
                onClick={() => setActivePlaygroundTab('preview')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  activePlaygroundTab === 'preview'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Eye size={13} />
                <span>Wireframe &amp; Store</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlaygroundTab('liquid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  activePlaygroundTab === 'liquid'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Code2 size={13} />
                <span>Shopify Liquid</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlaygroundTab('structure')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  activePlaygroundTab === 'structure'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <FolderArchive size={13} />
                <span>ZIP Structure</span>
              </button>
            </div>

            {/* Viewport Switcher */}
            {activePlaygroundTab === 'preview' && (
              <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewport('desktop')}
                  className={`rounded p-1 text-xs transition-colors ${
                    viewport === 'desktop' ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-400'
                  }`}
                  title="Desktop View"
                >
                  <Monitor size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport('mobile')}
                  className={`rounded p-1 text-xs transition-colors ${
                    viewport === 'mobile' ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-400'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Playground Content Area */}
          <div className="bg-neutral-50/50 p-4 sm:p-6 flex justify-center">
            {activePlaygroundTab === 'preview' && (
              viewport === 'mobile' ? (
                /* Mobile Phone Mockup View */
                <div className="w-full max-w-[360px] mx-auto rounded-[36px] border-[6px] border-neutral-900 bg-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300">
                  {/* Phone Top Notch / Dynamic Island Bar */}
                  <div className="bg-neutral-900 pt-2 pb-1 px-5 flex items-center justify-between text-[10px] text-neutral-400 font-mono select-none">
                    <span className="font-semibold text-neutral-300">9:41</span>
                    <div className="h-3 w-16 rounded-full bg-neutral-950 border border-neutral-800" />
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-neutral-400">5G</span>
                    </div>
                  </div>

                  {/* Inner Mobile Screen */}
                  <div className="bg-white rounded-b-[28px] overflow-hidden">
                    {/* Mobile Navbar */}
                    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-white">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#FF4500]" />
                        <span className="font-extrabold tracking-wider text-[11px] text-neutral-900">
                          AURA BOTANICALS
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-800">
                          Cart (0)
                        </div>
                        <button type="button" className="p-1 text-neutral-600 hover:text-neutral-950">
                          <Menu size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Hero Section */}
                    <div className="p-4 space-y-3.5 bg-white">
                      <span className="inline-block rounded-full bg-[#FFF3EE] px-2.5 py-0.5 text-[10px] font-bold text-[#FF4500] border border-[#FFCCBC]">
                        SPRING 2026 CLINICAL RELEASE
                      </span>
                      <h2 className="text-xl font-extrabold tracking-tight text-neutral-950 leading-snug">
                        Botanical Radiance Meets Cellular Science
                      </h2>
                      <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                        Formulated with cold-pressed bioactive botanicals to restore your skin barrier and unlock natural luminosity.
                      </p>

                      {/* Mobile Hero Image */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-xs">
                        <Image
                          src="/images/hero-skincare.jpg"
                          alt="Hero Skincare Product"
                          fill
                          priority
                          sizes="360px"
                          className="object-cover"
                        />
                      </div>

                      {/* Mobile CTAs */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          className="rounded-xl bg-[#FF4500] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#E03E00] text-center"
                        >
                          Shop All
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-neutral-200 bg-white py-2.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 text-center truncate px-2"
                        >
                          Clinical Proof
                        </button>
                      </div>
                    </div>

                    {/* Mobile Featured Products */}
                    <div className="px-4 pb-4 bg-white">
                      <div className="pt-3.5 border-t border-neutral-100">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Featured Products
                          </span>
                          <span className="text-[10px] font-bold text-[#FF4500] cursor-pointer">
                            View All (12) →
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                              <Image
                                src="/images/product-serum.jpg"
                                alt="Bioactive Barrier Serum"
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-neutral-900 truncate">
                                Bioactive Barrier Serum 50ml
                              </h4>
                              <p className="text-[10px] font-semibold text-neutral-500 mt-0.5">
                                ★ 4.9 (1,240 reviews)
                              </p>
                              <p className="text-xs font-extrabold text-[#FF4500] mt-0.5">$64.00</p>
                            </div>
                            <button
                              type="button"
                              className="rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-neutral-800 shrink-0"
                            >
                              Add
                            </button>
                          </div>

                          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                              <Image
                                src="/images/product-emulsion.jpg"
                                alt="Overnight Recovery Emulsion"
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-neutral-900 truncate">
                                Overnight Recovery Emulsion
                              </h4>
                              <p className="text-[10px] font-semibold text-neutral-500 mt-0.5">
                                ★ 5.0 (890 reviews)
                              </p>
                              <p className="text-xs font-extrabold text-[#FF4500] mt-0.5">$78.00</p>
                            </div>
                            <button
                              type="button"
                              className="rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-neutral-800 shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Validation Status Footer */}
                    <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 text-[11px] rounded-b-[28px]">
                      <span className="flex items-center gap-1 font-bold text-emerald-600 truncate">
                        <CheckCheck size={13} /> Patch Ready
                      </span>
                      <span className="font-mono text-neutral-500 text-[10px]">
                        100% Validated
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Store View */
                <div className="w-full mx-auto transition-all duration-300 rounded-2xl bg-white border border-neutral-200 shadow-xs overflow-hidden">
                  {/* Store Navbar Wireframe */}
                  <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF4500]" />
                      <span className="font-extrabold tracking-wider text-xs text-neutral-900">
                        AURA BOTANICALS
                      </span>
                    </div>
                    <div className="flex items-center gap-5 text-xs font-semibold text-neutral-600">
                      <span className="hover:text-neutral-950 cursor-pointer">Shop All</span>
                      <span className="hover:text-neutral-950 cursor-pointer">Best Sellers</span>
                      <span className="hover:text-neutral-950 cursor-pointer">Our Story</span>
                    </div>
                    <div className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-800">
                      Cart (0)
                    </div>
                  </div>

                  {/* Hero Showcase Section */}
                  <div className="p-6 sm:p-10">
                    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                      <div className="space-y-4">
                        <span className="inline-block rounded-full bg-[#FFF3EE] px-3 py-1 text-[11px] font-bold text-[#FF4500] border border-[#FFCCBC]">
                          SPRING 2026 CLINICAL RELEASE
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 leading-tight">
                          Botanical Radiance Meets Cellular Science
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                          Formulated with cold-pressed bioactive botanicals to restore your skin barrier and unlock natural luminosity.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            className="rounded-xl bg-[#FF4500] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#E03E00]"
                          >
                            Shop Collection
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                          >
                            Explore Clinical Proof
                          </button>
                        </div>
                      </div>

                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
                        <Image
                          src="/images/hero-skincare.jpg"
                          alt="Hero Skincare Product"
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Featured Products Row */}
                    <div className="mt-8 pt-6 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          Featured Products
                        </span>
                        <span className="text-xs font-bold text-[#FF4500] cursor-pointer">
                          View All (12) →
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                            <Image
                              src="/images/product-serum.jpg"
                              alt="Bioactive Barrier Serum"
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-900 truncate">
                              Bioactive Barrier Serum 50ml
                            </h4>
                            <p className="text-[11px] font-semibold text-neutral-500 mt-0.5">
                              ★ 4.9 (1,240 reviews)
                            </p>
                            <p className="text-xs font-extrabold text-[#FF4500] mt-1">$64.00</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-neutral-800 shrink-0"
                          >
                            Add to Cart
                          </button>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                            <Image
                              src="/images/product-emulsion.jpg"
                              alt="Overnight Recovery Emulsion"
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-900 truncate">
                              Overnight Recovery Emulsion
                            </h4>
                            <p className="text-[11px] font-semibold text-neutral-500 mt-0.5">
                              ★ 5.0 (890 reviews)
                            </p>
                            <p className="text-xs font-extrabold text-[#FF4500] mt-1">$78.00</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-neutral-800 shrink-0"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Status Footer */}
                  <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-6 py-3 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <CheckCheck size={15} /> Generation Completed (0ms patch ready)
                    </span>
                    <span className="font-mono text-neutral-500 text-[11px]">
                      100% Theme Check Pass
                    </span>
                  </div>
                </div>
              )
            )}

            {activePlaygroundTab === 'liquid' && (
              <div className="rounded-2xl border border-neutral-200 bg-[#0F1117] text-neutral-200 font-mono text-xs shadow-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-neutral-800 bg-[#161822] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      ✓ Validated OS 2.0
                    </span>
                    <span className="text-neutral-400 text-[11px]">sections/hero-banner.liquid</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:bg-neutral-700 transition-colors"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="p-4 overflow-x-auto max-h-[480px]">
                  <pre className="text-neutral-300 leading-relaxed font-mono">
                    <code>{liquidSnippet}</code>
                  </pre>
                </div>
              </div>
            )}

            {activePlaygroundTab === 'structure' && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 pb-4 border-b border-neutral-200">
                  <FolderArchive size={18} className="text-[#FF4500]" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Exported Shopify Theme ZIP Archive Structure
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5 rounded-xl bg-neutral-50 p-4 border border-neutral-200">
                    <p className="font-bold text-neutral-900 mb-2">📁 layout &amp; templates</p>
                    <p className="text-neutral-700">├── layout/theme.liquid</p>
                    <p className="text-neutral-700">├── templates/index.json</p>
                    <p className="text-neutral-700">├── templates/product.json</p>
                    <p className="text-neutral-700">├── templates/collection.json</p>
                    <p className="text-neutral-700">└── templates/cart.json</p>
                  </div>
                  <div className="space-y-1.5 rounded-xl bg-neutral-50 p-4 border border-neutral-200">
                    <p className="font-bold text-neutral-900 mb-2">📁 sections &amp; config</p>
                    <p className="text-neutral-700">├── sections/hero-banner.liquid</p>
                    <p className="text-neutral-700">├── sections/featured-products.liquid</p>
                    <p className="text-neutral-700">├── config/settings_schema.json</p>
                    <p className="text-neutral-700">├── config/settings_data.json</p>
                    <p className="text-neutral-700">└── locales/en.default.json</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logos & Trust Grid Bar (High-Impact Social Proof & Tech Architecture) */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200/80">
            {/* Left Col: Merchant Trust Metric */}
            <div className="lg:col-span-4 p-5 flex items-center justify-between sm:justify-start gap-4 bg-neutral-50/60">
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-gradient-to-tr from-[#FF5722] to-amber-400 text-[10px] font-bold text-white shadow-2xs">
                  SK
                </div>
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-gradient-to-tr from-purple-500 to-indigo-500 text-[10px] font-bold text-white shadow-2xs">
                  AT
                </div>
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-gradient-to-tr from-emerald-500 to-teal-500 text-[10px] font-bold text-white shadow-2xs">
                  MR
                </div>
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-neutral-900 text-[9px] font-extrabold text-white shadow-2xs">
                  +50k
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-extrabold text-neutral-950">4.9 / 5</span>
                </div>
                <span className="text-[11px] font-medium text-neutral-500 truncate mt-0.5">
                  Trusted by <strong className="text-neutral-900 font-bold">50,000+</strong> Shopify stores
                </span>
              </div>
            </div>

            {/* Right 4 Columns: Core Architecture Pillars */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/80">
              <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-neutral-50/80 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-neutral-950">Shopify OS 2.0</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-500 mt-0.5 font-mono">100% Native JSON</span>
              </div>

              <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-neutral-50/80 transition-colors">
                <div className="flex items-center gap-1.5">
                  <Code2 size={13} className="text-[#FF4500]" />
                  <span className="text-xs font-bold text-neutral-950">Liquid Engine</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-500 mt-0.5 font-mono">Zero Code Bloat</span>
              </div>

              <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-neutral-50/80 transition-colors">
                <div className="flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" />
                  <span className="text-xs font-bold text-neutral-950">ImageKit CDN</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-500 mt-0.5 font-mono">Auto WebP / AVIF</span>
              </div>

              <div className="p-4 flex flex-col items-center justify-center text-center group hover:bg-neutral-50/80 transition-colors">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-blue-500" />
                  <span className="text-xs font-bold text-neutral-950">Theme Check</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-500 mt-0.5 font-mono">1-Click ZIP Pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

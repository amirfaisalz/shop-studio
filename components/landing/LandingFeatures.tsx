'use client';

import { useState } from 'react';
import {
  Code2,
  Image as ImageIcon,
  History,
  Download,
  ShieldCheck,
  Zap,
  Sliders,
  Palette,
  Flame,
  Check,
  MousePointerClick,
} from 'lucide-react';
import BigSquaresBackground from './BigSquaresBackground';

export default function LandingFeatures() {
  const [activeCodeTab, setActiveCodeTab] = useState<'liquid' | 'schema'>('liquid');

  return (
    <section id="features" className="relative overflow-hidden py-24 bg-white text-neutral-900 border-b border-neutral-200/80">
      {/* Big Squares Background */}
      <BigSquaresBackground maskVariant="subtle" density="subtle" seedOffset={101} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCCBC] bg-[#FFF3EE] px-4 py-1.5 text-xs font-semibold text-[#FF3B00]">
            <Flame size={13} className="fill-[#FF3B00]" />
            <span>POWERED FOR SHOPIFY MERCHANTS</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-neutral-950">
            Clean Shopify Liquid. <br className="hidden sm:inline" />
            <span className="fire-gradient-text">Zero Code Bloat.</span>
          </h2>
          <p className="mt-4 text-base text-neutral-600 leading-relaxed">
            Unlike generic website builders that export static HTML, Antigravity generates native Shopify OS 2.0 JSON templates, modular sections, and editable schema settings.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Native Liquid & Schema (2 Cols) */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/50 md:col-span-2">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC] shadow-xs">
                    <Code2 size={24} strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-950">
                      Shopify OS 2.0 Liquid &amp; JSON Schemas
                    </h3>
                    <p className="text-xs font-medium text-neutral-500">
                      Native customizable sections with Theme Customizer settings
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('liquid')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      activeCodeTab === 'liquid' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    hero-banner.liquid
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('schema')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      activeCodeTab === 'schema' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    index.json
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-neutral-600 leading-relaxed">
                Antigravity transforms your prompt into modular Liquid sections with full <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-[#FF3B00] font-mono font-bold">{'% schema %'}</code> declarations. Merchants can adjust text, colors, image pickers, and repeatable blocks directly within Shopify’s visual customizer.
              </p>
            </div>

            {/* Code Mini Preview */}
            <div className="mt-6 overflow-hidden rounded-2xl bg-[#0F1117] p-4 font-mono text-[11px] text-neutral-300 border border-neutral-800 shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-neutral-400">
                    {activeCodeTab === 'liquid' ? 'sections/hero-banner.liquid' : 'templates/index.json'}
                  </span>
                </div>
                <span className="text-emerald-400 font-bold">✓ Validated OS 2.0 Schema</span>
              </div>

              {activeCodeTab === 'liquid' ? (
                <div className="space-y-1 text-neutral-300">
                  <p><span className="text-neutral-500">1</span>  <span className="text-[#F43F5E]">{'<section'}</span> <span className="text-[#38BDF8]">class=</span><span className="text-[#FDE047]">&quot;hero-container&quot;</span> <span className="text-[#A78BFA]">data-builder-section-id=</span><span className="text-[#FDE047]">&quot;hero&quot;</span><span className="text-[#F43F5E]">{'>'}</span></p>
                  <p><span className="text-neutral-500">2</span>    <span className="text-[#F43F5E]">{'<h1'}</span> <span className="text-[#38BDF8]">class=</span><span className="text-[#FDE047]">&quot;hero-title text-4xl font-black&quot;</span><span className="text-[#F43F5E]">{'>'}</span><span className="text-[#FF8A65]">{'{{'}</span> <span className="text-white">section.settings.heading</span> <span className="text-[#FF8A65]">{'}}'}</span><span className="text-[#F43F5E]">{'</h1>'}</span></p>
                  <p><span className="text-neutral-500">3</span>  <span className="text-[#F43F5E]">{'</section>'}</span></p>
                  <p><span className="text-neutral-500">4</span>  <span className="text-[#A78BFA]">{'{\% schema \%}'}</span></p>
                  <p><span className="text-neutral-500">5</span>  <span className="text-neutral-400">{'{ "name": "Hero Banner", "settings": [{ "type": "text", "id": "heading" }] }'}</span></p>
                  <p><span className="text-neutral-500">6</span>  <span className="text-[#A78BFA]">{'{\% endschema \%}'}</span></p>
                </div>
              ) : (
                <div className="space-y-1 text-neutral-300">
                  <p><span className="text-neutral-500">1</span>  <span className="text-white">{'{'}</span></p>
                  <p><span className="text-neutral-500">2</span>    <span className="text-[#38BDF8]">&quot;sections&quot;</span>: <span className="text-white">{'{'}</span></p>
                  <p><span className="text-neutral-500">3</span>      <span className="text-[#38BDF8]">&quot;hero&quot;</span>: <span className="text-white">{'{'}</span> <span className="text-[#38BDF8]">&quot;type&quot;</span>: <span className="text-[#FDE047]">&quot;hero-banner&quot;</span>, <span className="text-[#38BDF8]">&quot;settings&quot;</span>: <span className="text-white">{'{'}</span> <span className="text-[#38BDF8]">&quot;heading&quot;</span>: <span className="text-[#FDE047]">&quot;Botanical Radiance&quot;</span> <span className="text-white">{'}'}</span> <span className="text-white">{'}'}</span>,</p>
                  <p><span className="text-neutral-500">4</span>      <span className="text-[#38BDF8]">&quot;products&quot;</span>: <span className="text-white">{'{'}</span> <span className="text-[#38BDF8]">&quot;type&quot;</span>: <span className="text-[#FDE047]">&quot;featured-products&quot;</span> <span className="text-white">{'}'}</span></p>
                  <p><span className="text-neutral-500">5</span>    <span className="text-white">{'}'}</span>,</p>
                  <p><span className="text-neutral-500">6</span>    <span className="text-[#38BDF8]">&quot;order&quot;</span>: <span className="text-[#FDE047]">[&quot;hero&quot;, &quot;products&quot;]</span></p>
                  <p><span className="text-neutral-500">7</span>  <span className="text-white">{'}'}</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Scoped Inline AI Patches (1 Col) */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EDE9FE] text-[#8B5CF6] border border-[#DDD6FE] shadow-xs">
                  <Sliders size={24} strokeWidth={2} />
                </span>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-[#8B5CF6] border border-purple-200">
                  Targeted DOM Patch
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-neutral-950">
                Scoped Inline AI Patches
              </h3>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                Click any heading, CTA, or section. Request a micro-edit (e.g. &ldquo;Make this CTA pulse with glowing gradient&rdquo;) and AI outputs a precise, isolated patch without wiping your layout.
              </p>

              {/* Visual Diff Simulator */}
              <div className="mt-4 rounded-xl bg-neutral-50 p-3 border border-neutral-200/80 font-mono text-[10px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <MousePointerClick size={12} className="text-[#8B5CF6]" />
                  <span>Target: [data-element=&quot;hero-cta&quot;]</span>
                </div>
                <div className="text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded border border-rose-100">
                  - class: &quot;bg-neutral-900 text-white&quot;
                </div>
                <div className="text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                  + class: &quot;bg-gradient-to-r from-orange-500 shadow-lg&quot;
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-purple-50 border border-purple-200/80 px-3.5 py-2 text-xs font-semibold text-[#8B5CF6]">
              <span className="flex items-center gap-1.5"><History size={14} /> Infinite Revisions</span>
              <span className="text-[10px] font-mono font-bold">Undo / Redo</span>
            </div>
          </div>

          {/* Card 3: ImageKit Smart CDN (1 Col) */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0] shadow-xs">
                  <ImageIcon size={24} strokeWidth={2} />
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-[#10B981] border border-emerald-200">
                  Edge Delivery
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-neutral-950">
                ImageKit AI Asset Delivery
              </h3>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                Generate theme assets, perform AI background removal, and serve responsive AVIF/WebP images via global CDN with zero latency penalties.
              </p>

              {/* Compression Metric Stat Box */}
              <div className="mt-4 rounded-xl bg-neutral-50 p-3 border border-neutral-200/80 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Raw Asset:</span>
                  <span className="font-mono line-through text-neutral-400">2.4 MB PNG</span>
                </div>
                <div className="flex items-center justify-between font-bold text-emerald-600">
                  <span>ImageKit AVIF:</span>
                  <span className="font-mono">48 KB (-98%)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 text-xs font-semibold text-[#10B981]">
              <span className="flex items-center gap-1.5"><Zap size={14} /> Global Edge CDN</span>
              <span className="text-[10px] font-mono font-bold">12ms TTFB</span>
            </div>
          </div>

          {/* Card 4: Multi-page Cohesion (1 Col) */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A] shadow-xs">
                  <Palette size={24} strokeWidth={2} />
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-[#F59E0B] border border-amber-200">
                  Design System
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-neutral-950">
                5 Core Storefront Pages
              </h3>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                Generate matching styles across Homepage, Product Detail, Collection Grid, Slideout Cart, and Custom Story pages with shared token sync.
              </p>

              {/* Page Pill Selector */}
              <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                <span className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-neutral-800 text-center">✓ Home Page</span>
                <span className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-neutral-800 text-center">✓ Product Page</span>
                <span className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-neutral-800 text-center">✓ Collection</span>
                <span className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-neutral-800 text-center">✓ Drawer Cart</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs font-semibold text-[#F59E0B]">
              <span className="flex items-center gap-1.5"><Check size={14} /> Shared Token Sync</span>
              <span className="text-[10px] font-mono font-bold">100% Match</span>
            </div>
          </div>

          {/* Card 5: 1-Click ZIP Export (1 Col) */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE] shadow-xs">
                  <Download size={24} strokeWidth={2} />
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#3B82F6] border border-blue-200">
                  Shopify Admin
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-neutral-950">
                Instant ZIP Export
              </h3>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                Export directly into a standard Shopify theme archive with layout, templates, sections, snippets, locales, and settings schema ready for 1-click admin upload.
              </p>

              {/* Theme Archive Tree Simulation */}
              <div className="mt-4 rounded-xl bg-neutral-50 p-2.5 border border-neutral-200/80 font-mono text-[10px] text-neutral-600 space-y-0.5">
                <p className="text-neutral-900 font-bold">📦 theme-archive.zip</p>
                <p className="text-neutral-500">├── layout/theme.liquid</p>
                <p className="text-neutral-500">├── templates/*.json</p>
                <p className="text-neutral-500">└── config/settings_schema.json</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200/80 px-3.5 py-2 text-xs font-semibold text-[#3B82F6]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Theme Check Pass</span>
              <span className="text-[10px] font-mono font-bold">0 Errors</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

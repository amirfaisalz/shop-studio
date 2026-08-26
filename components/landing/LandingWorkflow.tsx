'use client';

import { Sparkles, MessageSquarePlus, PenTool, UploadCloud, ArrowRight, CheckCircle2, Flame, MousePointer, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    step: '01',
    title: 'Describe Brand & Aesthetic',
    desc: 'Enter your brand name, target industry, and aesthetic tone. Antigravity AI interprets your color hierarchy, typography, and generates a structured page plan.',
    icon: MessageSquarePlus,
    badge: 'Step 1: Intelligent Planning',
    color: 'bg-[#FFF3EE] text-[#FF3B00] border-[#FFCCBC]',
    bullets: ['Brand tone & palette matching', 'Multi-page architecture blueprint', 'Automatic section scoping'],
    preview: (
      <div className="mt-5 rounded-2xl bg-neutral-900 p-3.5 text-neutral-300 font-mono text-[10px] space-y-2 border border-neutral-800 shadow-inner">
        <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] pb-1.5 border-b border-neutral-800">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF4500]" />
          <span>PROMPT INTERPRETER</span>
        </div>
        <p className="text-neutral-200 truncate">&ldquo;Luxury skincare atelier with warm pastels...&rdquo;</p>
        <div className="flex flex-wrap gap-1 pt-0.5">
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300 text-[9px] border border-neutral-700">#Skincare</span>
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300 text-[9px] border border-neutral-700">#WarmPastels</span>
          <span className="rounded bg-[#FF4500]/20 px-1.5 py-0.5 text-[#FF8A65] text-[9px] border border-[#FF4500]/40 font-bold">5 Sections Ready</span>
        </div>
      </div>
    ),
  },
  {
    step: '02',
    title: 'Stream & Visually Refine',
    desc: 'Sections stream in real-time onto an interactive canvas. Click any element or image to trigger scoped AI edits with instant undo/redo revision history.',
    icon: PenTool,
    badge: 'Step 2: Interactive Fine-Tuning',
    color: 'bg-[#EDE9FE] text-[#8B5CF6] border-[#DDD6FE]',
    bullets: ['Real-time section streaming', 'Inline element selection & patching', 'ImageKit AI asset transforms'],
    preview: (
      <div className="mt-5 rounded-2xl bg-neutral-900 p-3.5 text-neutral-300 font-mono text-[10px] space-y-2 border border-neutral-800 shadow-inner">
        <div className="flex items-center justify-between text-neutral-400 text-[9px] pb-1.5 border-b border-neutral-800">
          <div className="flex items-center gap-1.5">
            <MousePointer size={10} className="text-purple-400" />
            <span>INLINE SELECTION</span>
          </div>
          <span className="text-purple-400 font-bold">Revision #3</span>
        </div>
        <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-2 text-purple-200 text-[10px]">
          Target: <strong className="text-white">hero-heading</strong>
          <span className="block text-[9px] text-purple-300 mt-0.5">Patch: + text-gradient-fiery</span>
        </div>
      </div>
    ),
  },
  {
    step: '03',
    title: '1-Click Export to Shopify',
    desc: 'Antigravity converts your HTML & Tailwind design into compliant Shopify OS 2.0 Liquid sections, settings schemas, and JSON templates packaged in a downloadable ZIP.',
    icon: UploadCloud,
    badge: 'Step 3: Direct Store Publishing',
    color: 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]',
    bullets: ['Valid Liquid and {% schema %} blocks', 'Standard theme folder structure', 'Direct upload to Shopify Admin'],
    preview: (
      <div className="mt-5 rounded-2xl bg-neutral-900 p-3.5 text-neutral-300 font-mono text-[10px] space-y-2 border border-neutral-800 shadow-inner">
        <div className="flex items-center justify-between text-neutral-400 text-[9px] pb-1.5 border-b border-neutral-800">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={10} className="text-emerald-400" />
            <span>THEME CHECK PASS</span>
          </div>
          <span className="text-emerald-400 font-bold">100% OS 2.0</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 text-[10px] text-emerald-300">
          <span>📦 aura-theme.zip</span>
          <span className="font-bold text-white bg-emerald-600 px-2 py-0.5 rounded text-[9px]">Download</span>
        </div>
      </div>
    ),
  },
];

export default function LandingWorkflow() {
  return (
    <section id="workflow" className="relative py-24 bg-neutral-50/60 text-neutral-900 border-b border-neutral-200/80">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCCBC] bg-[#FFF3EE] px-4 py-1.5 text-xs font-semibold text-[#FF3B00]">
            <Flame size={13} className="fill-[#FF3B00]" />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-neutral-950">
            From Idea to Live Shopify Store in 3 Steps
          </h2>
          <p className="mt-4 text-base text-neutral-600">
            A seamless workflow designed for merchants, e-commerce designers, and Shopify development teams.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-white p-7 sm:p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-neutral-300">{item.step}</span>
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl border shadow-xs ${item.color}`}>
                      <IconComp size={22} strokeWidth={2} />
                    </span>
                  </div>

                  <span className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-[#FF3B00]">
                    {item.badge}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-neutral-950">{item.title}</h3>
                  <p className="mt-3 text-xs text-neutral-600 leading-relaxed">{item.desc}</p>

                  {/* Micro UI Preview */}
                  {item.preview}
                </div>

                <div className="mt-6 pt-5 border-t border-neutral-100 space-y-2">
                  {item.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                      <CheckCircle2 size={14} className="shrink-0 text-[#10B981]" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Callout */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-7 py-4 text-xs font-bold text-white shadow-[0_4px_20px_rgba(255,59,0,0.3)] transition-all hover:brightness-105 hover:scale-105 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Try the 3-Step Builder Free</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

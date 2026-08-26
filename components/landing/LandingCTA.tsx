'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, Flame, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components';
import BigSquaresBackground from './BigSquaresBackground';

export default function LandingCTA() {
  const { user } = useAuth();

  return (
    <section className="relative py-28 overflow-hidden bg-white text-neutral-900 border-b border-neutral-200/80">
      {/* Big Squares Background */}
      <BigSquaresBackground maskVariant="center" density="normal" seedOffset={303} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCCBC] bg-[#FFF3EE] px-4 py-1.5 text-xs font-semibold text-[#FF3B00]">
          <Flame size={13} className="fill-[#FF3B00]" />
          <span>INSTANT STORE GENERATION</span>
        </div>

        <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight text-neutral-950">
          Ready to Build Your Next <br className="hidden sm:inline" />
          <span className="fire-gradient-text">Shopify Masterpiece?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-neutral-600">
          Join thousands of merchants, agencies, and e-commerce creators generating high-converting Shopify Online Store 2.0 themes in minutes.
        </p>

        {/* Interactive Simulated Prompt Pill */}
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-neutral-200/90 bg-white/90 p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 pl-3 text-xs text-neutral-500 truncate">
            <Sparkles size={15} className="text-[#FF4500] shrink-0" />
            <span className="truncate">&ldquo;Artisan specialty coffee roastery with subscription box...&rdquo;</span>
          </div>
          <Link
            href={user ? '/dashboard' : '/sign-up'}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 shrink-0 transition-colors shadow-xs"
          >
            Generate →
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={user ? '/dashboard' : '/sign-up'}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-8 py-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(255,59,0,0.35)] transition-all hover:brightness-105 hover:scale-105 cursor-pointer"
          >
            <Sparkles size={18} />
            <span>{user ? 'Open Dashboard Studio' : 'Start Building Free'}</span>
            <ArrowRight size={18} />
          </Link>
          <Link
            href="#playground"
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-7 py-4 text-sm font-semibold text-neutral-800 shadow-xs transition-all hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer"
          >
            <span>Try Live Playground</span>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 border-t border-neutral-100 pt-8">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={15} className="text-[#10B981]" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={15} className="text-[#10B981]" /> 100% Valid Shopify OS 2.0
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Zap size={15} className="text-[#10B981]" /> Instant ZIP Download
          </span>
        </div>
      </div>
    </section>
  );
}

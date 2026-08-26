'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Crown, ArrowRight, Flame, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/components';
import BigSquaresBackground from './BigSquaresBackground';

export default function LandingPricing() {
  const { user } = useAuth();
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative overflow-hidden py-24 bg-white text-neutral-900 border-b border-neutral-200/80">
      {/* Big Squares Background */}
      <BigSquaresBackground maskVariant="subtle" density="subtle" seedOffset={202} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCCBC] bg-[#FFF3EE] px-4 py-1.5 text-xs font-semibold text-[#FF3B00]">
            <Flame size={13} className="fill-[#FF3B00]" />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-neutral-950">
            Simple Plans for Every Merchant
          </h2>
          <p className="mt-4 text-base text-neutral-600">
            Start building for free. Upgrade when you need unlimited storefronts and 1-click Shopify theme ZIP exports.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${!annual ? 'text-neutral-950' : 'text-neutral-400'}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-neutral-300 transition-colors duration-200 ease-in-out focus:outline-none ${
                annual ? 'bg-[#FF3B00]' : 'bg-neutral-200'
              }`}
              role="switch"
              aria-checked={annual}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                  annual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${annual ? 'text-neutral-950' : 'text-neutral-400'}`}>
              Yearly <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Save 17% (2 Months Free)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {/* Free Starter Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-neutral-200/90 bg-neutral-50/60 p-8 shadow-xs transition-all duration-300 hover:border-neutral-300 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-950">Starter Free</h3>
                  <p className="text-xs text-neutral-500 mt-1">Perfect to test AI theme generation</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-neutral-200 text-neutral-700 shadow-xs">
                  <Zap size={18} />
                </span>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-neutral-950">$0</span>
                <span className="text-xs font-semibold text-neutral-500">/forever</span>
              </div>

              <ul className="mt-8 space-y-3.5 border-t border-neutral-200 pt-6">
                {[
                  'Up to 2 generated projects',
                  'Real-time streaming canvas preview',
                  'Inline AI visual section editing',
                  'Standard AI generation model',
                  'Unlimited preview revisions',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-xs font-medium text-neutral-700">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#10B981]" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href={user ? '/dashboard' : '/sign-up'}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-neutral-300 bg-white text-xs font-bold text-neutral-800 shadow-xs transition-all hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Link>
            </div>
          </div>

          {/* Pro Merchant Card (Highlighted Firecrawl Glow) */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#FF3B00] bg-white p-8 shadow-[0_12px_40px_rgba(255,59,0,0.14)] transition-all">
            {/* Popular Badge */}
            <div className="absolute -top-3.5 right-8">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-3.5 py-1 text-xs font-black text-white shadow-xs">
                <Crown size={12} /> MOST POPULAR
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-950">Pro Merchant</h3>
                  <p className="text-xs text-neutral-500 mt-1">For merchants, designers &amp; agencies</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                  <Crown size={18} />
                </span>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-neutral-950">
                  {annual ? '$290' : '$29'}
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  {annual ? '/year ($24/mo billed annually)' : '/month'}
                </span>
              </div>

              <ul className="mt-8 space-y-3.5 border-t border-neutral-200 pt-6">
                {[
                  'Unlimited projects & AI generations',
                  '1-Click Shopify Theme ZIP Export',
                  '100% Valid OS 2.0 Liquid + JSON Schemas',
                  'ImageKit smart AI image transforms & CDN',
                  'Priority generation speed & instant patches',
                  'Direct Shopify Admin upload ready',
                  'Commercial license for client stores',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-xs font-bold text-neutral-900">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#FF3B00]" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href={user ? '/billing' : '/sign-up'}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-xs font-bold text-white shadow-[0_4px_16px_rgba(255,59,0,0.35)] transition-all hover:brightness-105 hover:shadow-[0_6px_22px_rgba(255,59,0,0.45)] cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Upgrade to Pro Merchant</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Guarantees Row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 border-t border-neutral-100 pt-8">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={16} className="text-[#10B981]" /> 14-Day Money-Back Guarantee
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check size={16} className="text-[#10B981]" /> Cancel anytime with 1 click
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check size={16} className="text-[#10B981]" /> Commercial theme export rights
          </span>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, Zap, Layers, Star } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-[#fffdfc] flex">
      {/* Left Column: Visual Showcase & Brand Ambient (Hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[#0F1724] p-12 text-white">
        {/* Ambient Mesh Glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,88,64,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(136,92,248,0.22),transparent_45%)]" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="ShopStudio"
              width={42}
              height={42}
              className="rounded-xl shadow-md transition-transform group-hover:scale-105"
              priority
            />
            <div className="leading-tight">
              <span className="text-lg font-bold tracking-tight text-white">ShopStudio</span>
              <span className="block text-xs font-semibold text-[#FF8966]">AI THEME BUILDER</span>
            </div>
          </Link>
        </div>

        {/* Middle Visual Mockup & Feature Highlights */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#FF8966] backdrop-blur-md">
            <Sparkles size={13} />
            <span>THE NEXT-GEN THEME ENGINE</span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl text-white leading-tight">
            Build Stunning Shopify Stores with the Power of AI
          </h2>

          <p className="mt-4 text-sm text-neutral-300 leading-relaxed">
            Generate responsive Liquid sections, preview and fine-tune visually with scoped AI patches, and export 100% compliant Shopify OS 2.0 ZIP packages.
          </p>

          {/* Floating Feature Pills */}
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <Zap size={16} className="text-[#FF5840]" />
              <span>Real-time Generation</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <ShieldCheck size={16} className="text-[#22CC58]" />
              <span>100% OS 2.0 Valid</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <Layers size={16} className="text-[#885CF8]" />
              <span>Scoped AI Patches</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <Star size={16} className="text-[#F59B14]" />
              <span>1-Click ZIP Export</span>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs italic text-neutral-200 leading-relaxed">
              &ldquo;Antigravity generated our entire 5-page Shopify storefront in seconds. The Liquid output uploaded straight into our Shopify Admin without a single hitch.&rdquo;
            </p>
            <p className="mt-3 text-[11px] font-bold text-neutral-400">
              — Julian V., E-commerce Agency Director
            </p>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-400">
          <span>Shopify OS 2.0 Compliant</span>
          <span>© {new Date().getFullYear()} ShopStudio</span>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-12 md:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          {/* Mobile Logo Only */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="ShopStudio"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <div className="leading-tight">
                <span className="text-base font-bold text-[#0F1724]">ShopStudio</span>
                <span className="block text-xs font-semibold text-[#FF5840]">AI THEME BUILDER</span>
              </div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-[#e8e2de] bg-white p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,36,0.06)]">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F1724]">{title}</h1>
              <p className="mt-2 text-sm text-[#4B5563]">{subtitle}</p>
            </div>

            {children}
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-sm text-[#4B5563]">{footer}</div>
        </div>
      </div>
    </div>
  );
}

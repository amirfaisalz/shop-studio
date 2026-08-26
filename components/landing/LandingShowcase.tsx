'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  Check,
  Flame,
  Zap,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/components';
import { createProject } from '@/lib/projects';

interface ThemeTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  palette: { name: string; hex: string }[];
  features: string[];
  metrics: { label: string; value: string; icon: typeof TrendingUp };
  techBadge: string;
  imageUrl: string;
  tagline: string;
  prompt: string;
}

const templates: ThemeTemplate[] = [
  {
    id: 'aura',
    title: 'Aura Skincare Atelier',
    category: 'Beauty & Skincare',
    description: 'A serene luxury beauty theme with soothing warm pastels, clinical efficacy stats, variant shade selectors, and high-converting sticky CTA bar.',
    palette: [
      { name: 'Sunset Coral', hex: '#FF8966' },
      { name: 'Warm Cream', hex: '#FFE5DE' },
      { name: 'Deep Slate', hex: '#2C3E54' },
      { name: 'Pure Silk', hex: '#FFFFFF' },
    ],
    features: ['Efficacy Proof Counter', 'Shade & Variant Selector', 'Reviews Accordion', 'Sticky Add to Cart'],
    metrics: { label: 'Conversion Lift', value: '+38%', icon: TrendingUp },
    techBadge: 'OS 2.0 · 6 Liquid Blocks',
    imageUrl: '/images/hero-skincare.jpg',
    tagline: 'Radiance Meets Botanical Science',
    prompt: 'Create a high-end luxury skincare storefront named Aura Atelier with soothing warm tones, clinical trial proof badges, glowing product spotlight, and a clean slideout cart.',
  },
  {
    id: 'kuro',
    title: 'Kuro Cyber Streetwear',
    category: 'Fashion & Apparel',
    description: 'High-energy dark-mode streetwear theme with oversized typography, drop countdown timer, lookbook gallery, and quick-buy drawer.',
    palette: [
      { name: 'Cyber Void', hex: '#0F1724' },
      { name: 'Neon Flame', hex: '#FF3B00' },
      { name: 'Vapor Purple', hex: '#8B5CF6' },
      { name: 'Obsidian', hex: '#1E293B' },
    ],
    features: ['Drop Countdown Timer', 'Editorial Lookbook', 'Size Guide Modal', 'Mobile Bottom Bar'],
    metrics: { label: 'Mobile Score', value: '99/100', icon: Zap },
    techBadge: 'Dark Mode · Instant Drawer',
    imageUrl: '/images/showcase-streetwear.jpg',
    tagline: 'Next-Gen Streetwear Architecture',
    prompt: 'Build a high-energy dark streetwear brand store named Kuro Vanguard with limited edition countdown, oversized typography, grid lookbook, and instant cart drawer.',
  },
  {
    id: 'solstice',
    title: 'Solstice Swiss Horology',
    category: 'Luxury & Jewelry',
    description: 'Minimalist editorial aesthetic featuring ultra-high detail product zoom, sapphire crystal specs, and VIP concierge booking drawer.',
    palette: [
      { name: 'Onyx Black', hex: '#1C1917' },
      { name: 'Swiss Gold', hex: '#D4AF37' },
      { name: 'Titanium Grey', hex: '#78716C' },
      { name: 'Alabaster', hex: '#FAFAF9' },
    ],
    features: ['Technical Specs Table', 'VIP Consultation Form', 'Split Hero Layout', 'Currency Switcher'],
    metrics: { label: 'AOV Increase', value: '+42%', icon: TrendingUp },
    techBadge: 'Ultra 4K Zoom · Concierge',
    imageUrl: '/images/showcase-watch.jpg',
    tagline: 'Precision Chronograph Engineering',
    prompt: 'Design a luxury watch and timepiece Shopify store named Solstice Horology with high-contrast editorial minimalism, mechanical specs table, and VIP inquiry drawer.',
  },
  {
    id: 'origin',
    title: 'Origin Micro-Roasters',
    category: 'Food & Beverage',
    description: 'Warm organic theme with flavor profile radar charts, custom subscription frequency builders, and origin farm transparency maps.',
    palette: [
      { name: 'Espresso', hex: '#78350F' },
      { name: 'Roast Amber', hex: '#F59E0B' },
      { name: 'Crema Gold', hex: '#FEF3C7' },
      { name: 'Parchment', hex: '#FFFBEB' },
    ],
    features: ['Subscribe & Save Selector', 'Flavor Radar Notes', 'Roast Level Indicator', 'Bundle Builder'],
    metrics: { label: 'Recurring Subscriptions', value: '+54%', icon: Layers },
    techBadge: 'Sub Engine · Flavor Map',
    imageUrl: '/images/showcase-coffee.jpg',
    tagline: 'Single Origin Micro-Lot Coffees',
    prompt: 'Create an artisan coffee roastery storefront named Origin Micro-Roasters with flavor notes tags, roast profile sliders, subscription builder, and bundle discounts.',
  },
];

export default function LandingShowcase() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const categories = ['All', 'Beauty & Skincare', 'Fashion & Apparel', 'Luxury & Jewelry', 'Food & Beverage'];

  const filteredTemplates =
    selectedCategory === 'All'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleLaunchTemplate = async (template: ThemeTemplate) => {
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent('/dashboard')}`);
      return;
    }

    setLaunchingId(template.id);
    try {
      const project = await createProject(template.prompt);
      router.push(`/editor/${project.id}`);
    } catch {
      router.push('/dashboard');
    } finally {
      setLaunchingId(null);
    }
  };

  return (
    <section id="showcase" className="relative py-24 bg-white text-neutral-900 border-b border-neutral-200/80">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCCBC] bg-[#FFF3EE] px-4 py-1.5 text-xs font-semibold text-[#FF3B00]">
            <Flame size={13} className="fill-[#FF3B00]" />
            <span>CURATED STORE BLUEPRINTS</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-neutral-950">
            Stunning Themes for Every Industry
          </h2>
          <p className="mt-4 max-w-2xl text-base text-neutral-600">
            Every generated theme includes native Shopify sections, liquid presets, responsive grids, and conversion-optimized checkout paths.
          </p>

          {/* Category Filter Chips */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-neutral-100/80 border border-neutral-200/80 backdrop-blur-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {filteredTemplates.map((template) => {
            const MetricIcon = template.metrics.icon;
            return (
              <div
                key={template.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#FF5722]/60"
              >
                {/* Image Preview Banner */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                  <Image
                    src={template.imageUrl}
                    alt={template.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 flex flex-col justify-between">
                    {/* Top Row: Category + Tech Badge + Color Palette */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/20">
                          {template.category}
                        </span>
                        <span className="rounded-full bg-[#FF4500]/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                          {template.techBadge}
                        </span>
                      </div>

                      {/* Interactive Palette */}
                      <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1.5 border border-white/20">
                        {template.palette.map((color, idx) => (
                          <div
                            key={idx}
                            className="relative"
                            title={`${color.name} (${color.hex})`}
                          >
                            <span
                              className="block h-3.5 w-3.5 rounded-full border border-black/20 transition-transform duration-200 hover:scale-125 cursor-pointer"
                              style={{ backgroundColor: color.hex }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row on Banner */}
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-extrabold text-white tracking-tight">{template.title}</h3>
                        <p className="text-xs font-semibold text-[#FF8A65] mt-0.5">{template.tagline}</p>
                      </div>

                      {/* Key Performance Metric Pill */}
                      <div className="shrink-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 text-right">
                        <div className="flex items-center gap-1 text-[#4ADE80] text-xs font-extrabold justify-end">
                          <MetricIcon size={13} />
                          <span>{template.metrics.value}</span>
                        </div>
                        <span className="text-[10px] font-medium text-neutral-300 block">
                          {template.metrics.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="text-xs leading-relaxed text-neutral-600">
                    {template.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    {template.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs font-medium text-neutral-700 bg-neutral-50/80 rounded-xl px-3 py-2 border border-neutral-100">
                        <Check size={14} className="shrink-0 text-[#10B981]" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleLaunchTemplate(template)}
                      disabled={launchingId === template.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 disabled:opacity-50 cursor-pointer"
                    >
                      {launchingId === template.id ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border border-white border-t-transparent animate-spin" />
                          Generating Theme…
                        </span>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Use This Blueprint</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchTemplate(template)}
                      className="text-xs font-bold text-neutral-800 hover:text-[#FF3B00] group-hover:translate-x-0.5 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Open in Studio <ArrowRight size={13} className="text-[#FF3B00]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import {
  Flame,
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  Search,
  Download,
} from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Tag from '@/components/Tag';
import Alert from '@/components/Alert';

export default function DesignSystemPage() {
  const [tags, setTags] = useState(['Shopify OS 2.0', 'Fiery Gradient', 'Liquid Sections', 'Pro Merchant']);
  const [alerts, setAlerts] = useState<string[]>(['info', 'success', 'warning', 'error']);

  return (
    <div className="min-h-screen bg-[#fffdfc] px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-12 border-b border-neutral-200/80 pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF3B00]">
            <Flame size={14} className="fill-[#FF3B00]" />
            <span>FOUNDATIONS &amp; COMPONENTS</span>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">ShopStudio Design System</h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
            The unified fiery visual language for building rapid, high-conversion, and production-ready Shopify Online Store 2.0 theme experiences.
          </p>
        </header>

        {/* Design Principles */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF3B00]" />
            <h2 className="text-xl font-bold text-neutral-950">Core Principles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Zap size={22} className="text-[#FF3B00]" />,
                bg: 'bg-[#FFF3EE] border-[#FFCCBC]',
                title: 'High Velocity',
                desc: 'Generate full 5-page responsive Shopify stores in seconds with streaming AI preview.',
              },
              {
                icon: <Layers size={22} className="text-[#8B5CF8]" />,
                bg: 'bg-[#F0E9FF] border-[#DDD6FE]',
                title: 'Scoped Precision',
                desc: 'Point-and-click inline editing without full page regenerations or visual clutter.',
              },
              {
                icon: <ShieldCheck size={22} className="text-[#10B981]" />,
                bg: 'bg-[#ECFDF5] border-[#A7F3D0]',
                title: 'Shopify Native',
                desc: '100% compliant Liquid sections, schemas, blocks, and settings for direct OS 2.0 upload.',
              },
              {
                icon: <Flame size={22} className="text-[#FF3B00]" />,
                bg: 'bg-[#FFF3EE] border-[#FFCCBC]',
                title: 'Fiery & Modern',
                desc: 'Energetic warm gradients, sharp cards, high contrast, and refined micro-interactions.',
              },
            ].map((principle) => (
              <Card key={principle.title} shadow="sm" padding="md" className="transition-all hover:border-[#FF5722]/50 hover:shadow-md">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${principle.bg} mb-4`}>
                  {principle.icon}
                </div>
                <h3 className="text-base font-bold text-neutral-950 mb-1">{principle.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{principle.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Colors */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Flame size={18} className="text-[#FF3B00]" />
            <h2 className="text-xl font-bold text-neutral-950">Color Palette &amp; Tokens</h2>
          </div>

          {/* Primary Fiery Gradients */}
          <div className="mb-8 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Primary Fiery Gradient</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="h-20 flex-1 rounded-2xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] p-4 flex items-end justify-between text-white shadow-[0_4px_20px_rgba(255,59,0,0.3)]">
                <span className="font-bold text-sm">Main Firecrawl Gradient</span>
                <span className="font-mono text-xs opacity-90">#FF3B00 → #FF5E00 → #FFAA00</span>
              </div>
              <div className="h-20 flex-1 rounded-2xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] p-4 flex items-end justify-between text-white shadow-xs">
                <span className="font-bold text-sm">Action Gradient</span>
                <span className="font-mono text-xs opacity-90">#FF3B00 → #FF6200</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'Fire 900', hex: '#FF3B00', desc: 'Brand Primary' },
                { name: 'Fire 700', hex: '#FF5E00', desc: 'Gradient Mid' },
                { name: 'Fire 500', hex: '#FF7A00', desc: 'Gradient End' },
                { name: 'Fire 100', hex: '#FFCCBC', desc: 'Badge Border' },
                { name: 'Fire 50', hex: '#FFF3EE', desc: 'Badge Fill' },
              ].map((c) => (
                <div key={c.name} className="rounded-2xl border border-neutral-100 p-3 bg-neutral-50/50">
                  <div className="h-10 w-full rounded-xl shadow-2xs mb-2 border border-black/5" style={{ backgroundColor: c.hex }} />
                  <p className="text-xs font-bold text-neutral-950">{c.name}</p>
                  <p className="text-[10px] font-mono text-neutral-400">{c.hex}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Neutrals & Dark Tokens */}
          <div className="mb-8 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Dark Accents &amp; Surface Neutrals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[
                { name: 'Dark 950', hex: '#0A0A0A', desc: 'Headings & CTAs' },
                { name: 'Dark 900', hex: '#171717', desc: 'Sidebar Dark' },
                { name: 'Dark 700', hex: '#404040', desc: 'Body Text' },
                { name: 'Neutral 400', hex: '#A3A3A3', desc: 'Muted Captions' },
                { name: 'Neutral 200', hex: '#E5E5E5', desc: 'Card Borders' },
                { name: 'Surface 50', hex: '#FFFDFC', desc: 'App Background' },
              ].map((c) => (
                <div key={c.name} className="rounded-2xl border border-neutral-100 p-3 bg-neutral-50/50">
                  <div className="h-10 w-full rounded-xl shadow-2xs mb-2 border border-neutral-200" style={{ backgroundColor: c.hex }} />
                  <p className="text-xs font-bold text-neutral-950">{c.name}</p>
                  <p className="text-[10px] font-mono text-neutral-400">{c.hex}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Accents */}
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Semantic Accents</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'Success Emerald', hex: '#10B981', desc: 'OS 2.0 / Active' },
                { name: 'Warning Amber', hex: '#F59E0B', desc: 'Pro Crown / Quota' },
                { name: 'Error Crimson', hex: '#EF4444', desc: 'Validation Error' },
                { name: 'Shopify Blue', hex: '#3B82F6', desc: 'Admin / Export' },
                { name: 'Studio Purple', hex: '#8B5CF8', desc: 'AI Studio Tools' },
              ].map((c) => (
                <div key={c.name} className="rounded-2xl border border-neutral-100 p-3 bg-neutral-50/50">
                  <div className="h-10 w-full rounded-xl shadow-2xs mb-2" style={{ backgroundColor: c.hex }} />
                  <p className="text-xs font-bold text-neutral-950">{c.name}</p>
                  <p className="text-[10px] font-mono text-neutral-400">{c.hex}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buttons & Actions */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Zap size={18} className="text-[#FF3B00]" />
            <h2 className="text-xl font-bold text-neutral-950">Button Variants &amp; Micro-interactions</h2>
          </div>

          <Card shadow="sm" padding="lg" className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Primary (Fiery Gradient)</h3>
              <div className="flex gap-3 flex-wrap items-center">
                <Button variant="primary" size="lg">
                  <Sparkles size={16} className="mr-1.5" /> Generate Storefront
                </Button>
                <Button variant="primary" size="md">
                  <Download size={14} className="mr-1.5" /> Export Theme
                </Button>
                <Button variant="primary" size="sm">Small Action</Button>
                <Button variant="primary" size="md" disabled>Disabled State</Button>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Secondary &amp; Dark</h3>
              <div className="flex gap-3 flex-wrap items-center">
                <Button variant="dark" size="md">
                  Dark Mode Action
                </Button>
                <Button variant="secondary" size="md">
                  Secondary White
                </Button>
                <Button variant="ghost" size="md">
                  Ghost Button
                </Button>
                <Button variant="icon" size="md">
                  <Search size={16} />
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Form Components */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Layers size={18} className="text-[#FF3B00]" />
            <h2 className="text-xl font-bold text-neutral-950">Form Inputs &amp; Controls</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card shadow="sm" padding="md">
              <Input
                label="Storefront Name"
                placeholder="e.g. Aura Skincare Atelier"
                helperText="Enter a descriptive name for your Shopify theme."
              />
            </Card>

            <Card shadow="sm" padding="md">
              <Select
                label="Target Shopify Template"
                options={[
                  { value: 'index', label: 'Home Page (index.json)' },
                  { value: 'product', label: 'Product Detail (product.json)' },
                  { value: 'collection', label: 'Collection Grid (collection.json)' },
                  { value: 'cart', label: 'Cart Page (cart.json)' },
                ]}
                helperText="Select which template schema to preview or edit."
              />
            </Card>
          </div>
        </section>

        {/* Tags & Pills */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF3B00]" />
            <h2 className="text-xl font-bold text-neutral-950">Badges &amp; Status Tags</h2>
          </div>

          <Card shadow="sm" padding="lg">
            <div className="flex gap-3 flex-wrap items-center">
              <Tag variant="primary">🔥 Primary Fiery</Tag>
              <Tag variant="success">✓ Active Pro</Tag>
              <Tag variant="warning">⚡ 2 Quota Remaining</Tag>
              <Tag variant="purple">✦ AI Studio 2.0</Tag>
              <Tag variant="info">ⓘ Shopify Ready</Tag>
              <Tag variant="default">Default Neutral</Tag>
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-2">Removable Tag Chips:</p>
              <div className="flex gap-2 flex-wrap">
                {tags.map((tag, i) => (
                  <Tag
                    key={tag}
                    variant={i === 0 ? 'primary' : i === 1 ? 'fiery' : i === 2 ? 'purple' : 'success'}
                    onRemove={() => setTags(tags.filter((_, idx) => idx !== i))}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Feedback & Alerts */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#FF3B00]" />
            <h2 className="text-xl font-bold text-neutral-950">Feedback &amp; Alert Notifications</h2>
          </div>

          <div className="space-y-4">
            {alerts.includes('info') && (
              <Alert
                variant="info"
                title="Shopify OS 2.0 Ready"
                onDismiss={() => setAlerts(alerts.filter((a) => a !== 'info'))}
              >
                All generated storefronts include valid Liquid schemas, settings presets, and customizable blocks ready for 1-click ZIP export.
              </Alert>
            )}

            {alerts.includes('success') && (
              <Alert
                variant="success"
                title="Pro Merchant Plan Active"
                onDismiss={() => setAlerts(alerts.filter((a) => a !== 'success'))}
              >
                Your account has unlimited AI generations, full Shopify theme ZIP exports, and ImageKit transformations.
              </Alert>
            )}

            {alerts.includes('warning') && (
              <Alert
                variant="warning"
                title="Free Quota Nearing Limit"
                onDismiss={() => setAlerts(alerts.filter((a) => a !== 'warning'))}
              >
                You have used 2 of 2 free storefront slots. Upgrade to Pro to build unlimited stores.
              </Alert>
            )}

            {alerts.includes('error') && (
              <Alert
                variant="error"
                title="Validation Warning"
                onDismiss={() => setAlerts(alerts.filter((a) => a !== 'error'))}
              >
                Ensure all required Liquid settings schema types are configured before exporting theme assets.
              </Alert>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


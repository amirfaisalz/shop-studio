'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function LandingFooter() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerOffset = 72;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-900 py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-xs">
                <Flame size={18} className="fill-white" />
              </div>
              <div className="leading-tight">
                <p className="text-base font-extrabold text-neutral-950">Shopify AI</p>
                <p className="text-[10px] font-bold text-[#FF3B00]">OS 2.0 ARCHITECT</p>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-neutral-600">
              Generate production-ready Shopify Online Store 2.0 themes with clean Liquid sections, responsive Tailwind styling, ImageKit asset optimization, and direct 1-click ZIP export.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-neutral-400">
              <span>Engineered for modern commerce teams</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">Product</p>
            <ul className="mt-4 space-y-2.5 text-xs text-neutral-600">
              {[
                { label: 'Playground', href: '#playground' },
                { label: 'Features', href: '#features' },
                { label: 'Theme Blueprints', href: '#showcase' },
                { label: 'How It Works', href: '#workflow' },
                { label: 'Pricing Plans', href: '#pricing' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="hover:text-[#FF3B00] transition-colors cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Stack & Platform */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">Architecture</p>
            <ul className="mt-4 space-y-2.5 text-xs text-neutral-600">
              <li>Shopify Online Store 2.0</li>
              <li>Liquid &amp; JSON Templates</li>
              <li>Tailwind CSS</li>
              <li>ImageKit Smart Delivery</li>
              <li>InsForge BaaS</li>
            </ul>
          </div>

          {/* Account & App */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">Quick Access</p>
            <ul className="mt-4 space-y-2.5 text-xs text-neutral-600">
              <li>
                <Link href="/dashboard" className="hover:text-[#FF3B00] transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-[#FF3B00] transition-colors">Projects</Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-[#FF3B00] transition-colors">Billing</Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[#FF3B00] transition-colors">Sign In</Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-[#FF3B00] transition-colors">Sign Up</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Shopify AI Theme Builder. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Shopify OS 2.0 Compliant</span>
            <span>•</span>
            <span>Commercial License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Flame,
  Menu,
  X,
  Code2,
  Sliders,
  Layers,
  HelpCircle,
  CreditCard,
  Zap,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/components';

export default function LandingHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change or ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.refresh();
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
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

  const navLinks = [
    { label: 'Playground', href: '#playground', icon: Code2 },
    { label: 'Blueprints', href: '#showcase', icon: Layers },
    { label: 'Features', href: '#features', icon: Sliders },
    { label: 'How It Works', href: '#workflow', icon: Zap },
    { label: 'Pricing', href: '#pricing', icon: CreditCard },
    { label: 'FAQ', href: '#faq', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Flame */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:opacity-90 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-[0_2px_10px_rgba(255,59,0,0.35)]">
            <Flame size={20} className="fill-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base font-extrabold tracking-tight text-neutral-950">ShopStudio</span>
              <span className="rounded-md bg-[#FFF3EE] px-1.5 py-0.5 text-[10px] font-bold text-[#FF4500] border border-[#FFCCBC]">
                OS 2.0
              </span>
            </div>
            <span className="text-[10px] font-medium text-neutral-500 tracking-wide mt-0.5">AI THEME BUILDER</span>
          </div>
        </Link>

        {/* Desktop Center Nav Links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-950 cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth CTA Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 shadow-2xs transition-all hover:bg-neutral-50 hover:border-neutral-300"
              >
                <LayoutDashboard size={14} className="text-[#FF3B00]" />
                <span>Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 shadow-2xs transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/sign-in"
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-700 transition-colors hover:text-neutral-950"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] px-4 py-2 text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition-all hover:brightness-105 hover:shadow-[0_4px_16px_rgba(255,59,0,0.4)]"
              >
                <Sparkles size={13} />
                <span>Start Free</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button (Clean & Borderless) */}
        <div className="flex lg:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus:outline-none"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200/90 bg-white/95 backdrop-blur-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-3">
            {/* Nav Links */}
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
                  >
                    <Icon size={14} className="text-[#FF4500]" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            {/* Mobile Auth Divider & CTAs */}
            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
              {user ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-2.5 border border-neutral-200">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 border border-neutral-200 shadow-2xs hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#FF4500] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#E03E00]"
                  >
                    <Sparkles size={13} />
                    <span>Start Free</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

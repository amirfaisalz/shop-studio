'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, CreditCard, Flame } from 'lucide-react';
import SidebarUser from './SidebarUser';
import SidebarBilling from './billing/SidebarBilling';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/billing', label: 'Billing & Plans', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-200/80 bg-white/95 px-5 py-6 backdrop-blur-md">
      {/* Brand Logo matching Landing Header */}
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-1 group transition-transform">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-[0_2px_12px_rgba(255,59,0,0.35)] transition-transform group-hover:scale-105">
          <Flame size={22} className="fill-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-extrabold tracking-tight text-neutral-950">ShopStudio</span>
            <span className="rounded-md bg-[#FFF3EE] px-1.5 py-0.5 text-[9px] font-bold text-[#FF4500] border border-[#FFCCBC]">
              OS 2.0
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#FF5722] tracking-wider mt-1">AI THEME BUILDER</span>
        </div>
      </Link>

      {/* Nav items */}
      <nav className="space-y-2">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/projects' && pathname.startsWith('/projects'));
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#FFF3EE] text-[#FF3B00] font-bold border border-[#FFCCBC]/80 shadow-xs'
                  : 'text-neutral-600 font-medium hover:bg-neutral-100/80 hover:text-neutral-950'
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-[#FF3B00] shadow-xs'
                    : 'bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-neutral-900 group-hover:shadow-2xs'
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.9} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 space-y-4 border-t border-neutral-100">
        <SidebarBilling />
        <SidebarUser />
      </div>
    </aside>
  );
}

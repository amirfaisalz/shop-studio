'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronsUpDown,
  CreditCard,
  Crown,
  Gauge,
  Loader2,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription } from './SubscriptionProvider';
import { openBillingPortal } from '@/lib/billing/client';
import { FREE_PROJECT_LIMIT } from '@/lib/billing/plans';
import UpgradeDialog from './UpgradeDialog';

/**
 * Sidebar footer billing block. For Free users it shows project usage with a
 * progress bar and an Upgrade button; for paid users it shows an "Unlimited /
 * Pro Plan" badge. A billing popover exposes View Plan, Manage Billing, Upgrade
 * Plan, and View Usage.
 */
export default function SidebarBilling() {
  const { user } = useAuth();
  const { entitlement, loading } = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  // Only relevant to signed-in users.
  if (!user) return null;

  if (loading && !entitlement) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
        <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-neutral-200" />
      </div>
    );
  }

  const isPaid = entitlement?.isPaid ?? false;
  const projectCount = entitlement?.projectCount ?? 0;
  const maxProjects = entitlement?.maxProjects ?? FREE_PROJECT_LIMIT;
  const remaining = entitlement?.remaining ?? Math.max(0, FREE_PROJECT_LIMIT - projectCount);
  const atLimit = !isPaid && remaining <= 0;
  const pct = isPaid || !maxProjects ? 100 : Math.min(100, Math.round((projectCount / maxProjects) * 100));

  async function manageBilling() {
    if (portalBusy) return;
    setPortalBusy(true);
    try {
      await openBillingPortal();
    } catch {
      setPortalBusy(false);
      window.location.assign('/billing');
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {isPaid ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-[#FFF8EE] via-[#FFF3E0] to-[#FFE8CC] p-3.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-amber-600 shadow-xs border border-amber-200/60">
              <Crown size={17} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-950 truncate">Unlimited Themes</p>
              <p className="text-[11px] font-semibold text-amber-700">Pro Merchant Active</p>
            </div>
            <button
              type="button"
              aria-label="Billing menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-7 w-7 place-items-center rounded-lg text-amber-800 transition hover:bg-white/80"
            >
              <ChevronsUpDown size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900">Project Quota</span>
            <button
              type="button"
              aria-label="Billing menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-6 w-6 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700"
            >
              <ChevronsUpDown size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="mt-1 flex items-baseline justify-between text-[11px]">
            <span className="font-semibold text-neutral-500">
              {projectCount} of {maxProjects} storefronts
            </span>
            <span className="font-mono font-bold text-neutral-900">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/80">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                atLimit
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00]'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-neutral-500">
            {atLimit
              ? 'Upgrade to build more themes'
              : `${remaining} project${remaining === 1 ? '' : 's'} remaining`}
          </p>
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] text-xs font-bold text-white shadow-[0_2px_10px_rgba(255,59,0,0.25)] transition-all hover:brightness-105 hover:shadow-sm cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.12)] z-50 animate-in fade-in-50 slide-in-from-bottom-2 duration-150">
          <Link
            href="/billing"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-[#FFF3EE] hover:text-[#FF3B00]"
          >
            <CreditCard size={15} strokeWidth={2} className="text-neutral-400" />
            <span>View Plan Details</span>
          </Link>
          <button
            type="button"
            onClick={() => void manageBilling()}
            disabled={portalBusy}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 transition hover:bg-[#FFF3EE] hover:text-[#FF3B00] disabled:opacity-60 cursor-pointer"
          >
            {portalBusy ? (
              <Loader2 size={15} className="animate-spin text-neutral-400" />
            ) : (
              <Receipt size={15} strokeWidth={2} className="text-neutral-400" />
            )}
            <span>Manage Billing (Stripe)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setUpgradeOpen(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#FF3B00] transition hover:bg-[#FFF3EE] cursor-pointer"
          >
            <Sparkles size={15} strokeWidth={2} />
            <span>Upgrade Plan</span>
          </button>
          <Link
            href="/billing#usage"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-[#FFF3EE] hover:text-[#FF3B00]"
          >
            <Gauge size={15} strokeWidth={2} className="text-neutral-400" />
            <span>Usage &amp; Exports</span>
          </Link>
        </div>
      )}

      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Check, Crown, Loader2, Sparkles, X, Flame } from 'lucide-react';
import { PAID_PLANS, formatPrice } from '@/lib/billing/plans';
import { startCheckout } from '@/lib/billing/client';

/**
 * Reusable upgrade modal shown when a Free user hits the project limit or tries
 * to export. Presents the Monthly and Yearly plans and starts Stripe Checkout
 * for the chosen one.
 */
interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function UpgradeDialog({
  open,
  onClose,
  title = 'Upgrade to Pro Merchant',
  description = 'You’re on the Free plan. Upgrade to create unlimited storefronts and download theme ZIP packages.',
}: UpgradeDialogProps) {
  const [busy, setBusy] = useState<null | 'monthly' | 'yearly'>(null);
  const [error, setError] = useState('');

  if (!open) return null;

  async function choose(plan: 'monthly' | 'yearly') {
    if (busy) return;
    setError('');
    setBusy(plan);
    try {
      await startCheckout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-neutral-950/60 p-4 backdrop-blur-sm animate-in fade-in-50 duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-[620px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_32px_72px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-[0_2px_12px_rgba(255,59,0,0.35)]">
              <Flame size={22} className="fill-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-950">{title}</h2>
              <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">{description}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={busy !== null}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-40 cursor-pointer"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {PAID_PLANS.map((plan) => {
            const isYearly = plan.id === 'yearly';
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-5 transition-all ${
                  isYearly
                    ? 'border-2 border-[#FF3B00] bg-gradient-to-b from-[#FFFDFB] to-[#FFF8F5] shadow-xs'
                    : 'border border-neutral-200/90 bg-neutral-50/50'
                }`}
              >
                {isYearly && (
                  <div className="absolute -top-3 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF3B00] to-[#FF6200] px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                      <Crown size={10} /> SAVE 17%
                    </span>
                  </div>
                )}

                <div className="mb-3">
                  <p className="text-sm font-bold text-neutral-950">{plan.name}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-neutral-950">
                      {formatPrice(plan.amount, plan.currency)}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold">/{plan.interval}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 font-medium">{plan.tagline}</p>
                </div>

                <ul className="mb-5 space-y-2 border-t border-neutral-200/60 pt-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-neutral-700 font-medium">
                      <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-[#FF3B00]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => void choose(plan.id as 'monthly' | 'yearly')}
                  disabled={busy !== null}
                  className="mt-auto flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {busy === plan.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Choose {plan.name}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="px-6 pb-5 text-center text-xs font-semibold text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}

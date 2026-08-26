'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Download,
  Info,
  Loader2,
  Sparkles,
  Flame,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react';
import { useAuth } from '@/components';
import { useSubscription } from '@/components/billing/SubscriptionProvider';
import {
  openBillingPortal,
  setCancelAtPeriodEnd,
  startCheckout,
} from '@/lib/billing/client';
import {
  FREE_PROJECT_LIMIT,
  PLANS,
  formatPrice,
  type PlanId,
} from '@/lib/billing/plans';

/** Pretty labels for subscription statuses. */
const STATUS_LABEL: Record<string, string> = {
  free: 'Free Tier',
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past Due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  paused: 'Paused',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BillingPage() {
  const { loading: authLoading } = useAuth();
  const { entitlement, loading, refresh } = useSubscription();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Derive the checkout-result banner from the return URL on first render, so we
  // don't setState inside an effect.
  const [banner] = useState<'success' | 'cancelled' | null>(() => {
    if (typeof window === 'undefined') return null;
    const checkout = new URLSearchParams(window.location.search).get('checkout');
    return checkout === 'success' ? 'success' : checkout === 'cancelled' ? 'cancelled' : null;
  });

  // After a successful checkout, refresh entitlement so permissions reflect the
  // just-completed webhook, then clean the query string from the URL.
  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get('checkout');
    if (checkout === 'success') void refresh();
    if (checkout) window.history.replaceState({}, '', '/billing');
  }, [refresh]);

  if (authLoading || (loading && !entitlement)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffdfc] text-neutral-400">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 size={20} className="animate-spin text-[#FF3B00]" />
          Loading billing details…
        </div>
      </div>
    );
  }

  const plan: PlanId = entitlement?.plan ?? 'free';
  const isPaid = entitlement?.isPaid ?? false;
  const status = entitlement?.status ?? 'free';
  const projectCount = entitlement?.projectCount ?? 0;
  const maxProjects = entitlement?.maxProjects ?? FREE_PROJECT_LIMIT;
  const cancelAtPeriodEnd = entitlement?.cancelAtPeriodEnd ?? false;
  const periodEnd = entitlement?.currentPeriodEnd ?? null;

  async function run(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setError('');
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    await run('cancel', async () => {
      await setCancelAtPeriodEnd(true);
      await refresh();
    });
  }
  async function resume() {
    await run('resume', async () => {
      await setCancelAtPeriodEnd(false);
      await refresh();
    });
  }

  const usagePct =
    isPaid || !maxProjects ? 100 : Math.min(100, Math.round((projectCount / maxProjects) * 100));

  return (
    <div className="min-h-screen bg-[#fffdfc] px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-neutral-200/80 pb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF3B00]">
            <Flame size={14} className="fill-[#FF3B00]" />
            <span>SUBSCRIPTION &amp; QUOTA</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">Billing &amp; Plans</h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">
            Manage your subscription, storefront quota, and payment methods.
          </p>
        </header>

        {banner === 'success' && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-[#F0FDF4] px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 shadow-2xs">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>Subscription active — welcome to Pro Merchant! Enjoy unlimited themes and ZIP exports.</span>
          </div>
        )}
        {banner === 'cancelled' && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-xs sm:text-sm font-semibold text-amber-800 shadow-2xs">
            <Info size={18} className="text-amber-600 shrink-0" />
            <span>Checkout cancelled — no changes were made to your account.</span>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm font-semibold text-red-800 shadow-2xs">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current plan summary */}
        <section className="mb-8 rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  isPaid
                    ? 'bg-[#FFF8EE] text-amber-600 border-amber-200 shadow-xs'
                    : 'bg-[#FFF3EE] text-[#FF3B00] border-[#FFCCBC]'
                }`}
              >
                {isPaid ? <Crown size={24} strokeWidth={2} /> : <CreditCard size={24} strokeWidth={2} />}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-950">{PLANS[plan].name} Plan</h2>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      status === 'active' || status === 'trialing'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : status === 'past_due' || status === 'unpaid'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {isPaid ? (
                    <span>
                      {cancelAtPeriodEnd ? 'Cancels on ' : 'Renews on '}
                      <strong>{formatDate(periodEnd)}</strong>
                    </span>
                  ) : (
                    <span>Free starter tier includes 2 generated storefronts</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPaid && (
                <button
                  onClick={() => void run('portal', openBillingPortal)}
                  disabled={busy !== null}
                  className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 shadow-2xs transition hover:bg-neutral-50 disabled:opacity-60 cursor-pointer"
                >
                  {busy === 'portal' ? <Loader2 size={14} className="animate-spin text-neutral-500" /> : <CreditCard size={14} />}
                  <span>Manage Billing (Stripe)</span>
                </button>
              )}
              {isPaid && !cancelAtPeriodEnd && (
                <button
                  onClick={() => void cancel()}
                  disabled={busy !== null}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                >
                  {busy === 'cancel' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  <span>Cancel subscription</span>
                </button>
              )}
              {isPaid && cancelAtPeriodEnd && (
                <button
                  onClick={() => void resume()}
                  disabled={busy !== null}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] to-[#FF6200] px-4 text-xs font-bold text-white shadow-xs transition hover:brightness-105 disabled:opacity-60 cursor-pointer"
                >
                  {busy === 'resume' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Resume subscription</span>
                </button>
              )}
            </div>
          </div>

          {cancelAtPeriodEnd && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-3.5 text-xs text-amber-800 font-medium">
              Your subscription is scheduled to cancel on {formatDate(periodEnd)}. You will keep full Pro Merchant access until that date.
            </p>
          )}
        </section>

        {/* Usage & Entitlements Overview */}
        <section id="usage" className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Storefront Quota</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF3B00] border border-[#FFCCBC]">
                <Zap size={16} />
              </span>
            </div>
            <p className="mt-2 text-3xl font-black text-neutral-950">
              {projectCount}
              <span className="text-base font-semibold text-neutral-400">
                {' '}/ {isPaid ? '∞' : maxProjects}
              </span>
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] transition-all duration-300"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-neutral-500 font-medium">
              {isPaid ? 'Unlimited themes & AI generations on Pro.' : `${Math.max(0, maxProjects - projectCount)} storefront slot${Math.max(0, maxProjects - projectCount) === 1 ? '' : 's'} remaining.`}
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Shopify OS 2.0 Export</span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl border ${
                  entitlement?.canExport ? 'bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE]' : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                }`}
              >
                <Download size={16} strokeWidth={2} />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl font-bold text-neutral-950">
                {entitlement?.canExport ? '1-Click ZIP Enabled' : 'Disabled on Free Tier'}
              </span>
            </div>
            <p className="mt-2.5 text-xs text-neutral-500 font-medium">
              {entitlement?.canExport
                ? 'Export any storefront as a 100% compliant Shopify theme ZIP archive.'
                : 'Upgrade to Pro Merchant to export and upload themes directly to Shopify Admin.'}
            </p>
          </div>
        </section>

        {/* Pricing / Plan Switching Grid matching LandingPricing.tsx */}
        <section className="mb-10">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-neutral-950">Available Plans</h2>
              <p className="text-xs text-neutral-500">Pick the right plan for your e-commerce storefront goals.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
            {(['free', 'monthly', 'yearly'] as PlanId[]).map((id) => {
              const p = PLANS[id];
              const isCurrent = plan === id;
              const isPaidPlan = id !== 'free';
              const isYearly = id === 'yearly';

              return (
                <div
                  key={id}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-200 ${
                    isYearly
                      ? 'border-2 border-[#FF3B00] bg-white shadow-[0_8px_30px_rgba(255,59,0,0.12)]'
                      : isCurrent
                        ? 'border-2 border-neutral-950 bg-white shadow-md'
                        : 'border border-neutral-200/90 bg-white shadow-xs hover:border-neutral-300'
                  }`}
                >
                  {isYearly && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] px-3 py-0.5 text-[11px] font-black text-white shadow-xs">
                        <Crown size={11} /> MOST POPULAR (SAVE 17%)
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-bold text-neutral-950">{p.name}</h3>
                      {isCurrent && (
                        <span className="rounded-full bg-[#FFF3EE] px-2.5 py-0.5 text-[11px] font-bold text-[#FF3B00] border border-[#FFCCBC]">
                          Current Plan
                        </span>
                      )}
                    </div>

                    <p className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-neutral-950">
                        {formatPrice(p.amount, p.currency)}
                      </span>
                      {p.interval && <span className="text-xs font-semibold text-neutral-500">/{p.interval}</span>}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 font-medium">{p.tagline}</p>

                    <ul className="my-5 space-y-2.5 border-t border-neutral-100 pt-4">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-neutral-700 font-medium">
                          <Check size={15} strokeWidth={2.4} className={`mt-0.5 shrink-0 ${isPaidPlan ? 'text-[#FF3B00]' : 'text-[#10B981]'}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-2">
                    {isCurrent ? (
                      <button
                        disabled
                        className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-100 text-xs font-bold text-neutral-400 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : isPaidPlan ? (
                      <button
                        onClick={() => void run(`checkout-${id}`, () => startCheckout(id as 'monthly' | 'yearly'))}
                        disabled={busy !== null}
                        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition-all hover:brightness-105 hover:shadow-[0_4px_16px_rgba(255,59,0,0.4)] disabled:opacity-60 cursor-pointer"
                      >
                        {busy === `checkout-${id}` ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>{isPaid ? 'Switch to ' + p.name : 'Upgrade to ' + p.name}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => void run('portal', openBillingPortal)}
                        disabled={busy !== null || !isPaid}
                        className="h-11 w-full rounded-2xl border border-neutral-200 bg-white text-xs font-bold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                        title={isPaid ? 'Manage billing via Stripe portal' : ''}
                      >
                        {isPaid ? 'Downgrade via Portal' : 'Starter Included'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Guarantees Row */}
        <section className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 border-t border-neutral-100 pt-8 pb-4">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={16} className="text-[#10B981]" /> 14-Day Money-Back Guarantee
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check size={16} className="text-[#10B981]" /> Cancel anytime with 1 click
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Check size={16} className="text-[#10B981]" /> Full Shopify OS 2.0 Export Rights
          </span>
        </section>
      </div>
    </div>
  );
}


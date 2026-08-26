'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Sparkles,
  ChevronsUpDown,
  CreditCard,
  FolderOpen,
  Palette,
  Loader2,
  Crown,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useSubscription } from '@/components/billing/SubscriptionProvider';

/** Two-letter initials for the avatar fallback, derived from name or email. */
function getInitials(name: string | null | undefined, email: string): string {
  const source = (name?.trim() || email.split('@')[0] || '').trim();
  if (!source) return '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export default function SidebarUser() {
  const { user, loading, signOut } = useAuth();
  const { entitlement } = useSubscription();
  const router = useRouter();

  const [imageFailed, setImageFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setConfirmSignOut(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setMenuOpen(false);
      setConfirmSignOut(false);
      router.push('/');
    } catch (err) {
      console.error('[auth] Failed to sign out:', err);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-2">
        <div className="flex items-center gap-3 p-1.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-neutral-200/80" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-200/80" />
            <div className="h-2 w-28 animate-pulse rounded bg-neutral-200/80" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-1">
        <p className="mb-2.5 text-xs leading-relaxed text-neutral-500 font-medium">
          Sign in to save themes, revisions, and export Shopify packages.
        </p>
        <Link
          href="/sign-in"
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-xs font-bold text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] transition-all hover:brightness-105"
        >
          <Sparkles size={14} />
          <span>Sign In to Account</span>
        </Link>
      </div>
    );
  }

  const displayName = user.name || user.email.split('@')[0];
  const showImage = user.avatarUrl && !imageFailed;
  const isPaid = entitlement?.isPaid ?? false;

  return (
    <div className="relative pt-1" ref={menuRef}>
      {/* Upward Popover Menu */}
      {menuOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[240px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_16px_36px_rgba(0,0,0,0.14)] animate-in fade-in-50 zoom-in-95 duration-150 z-50">
          {/* User Profile Header */}
          <div className="flex items-center gap-2.5 border-b border-neutral-100 p-2.5 pb-3">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl as string}
                alt={displayName}
                width={36}
                height={36}
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-neutral-200"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF3EE] text-xs font-black text-[#FF3B00] border border-[#FFCCBC]">
                {getInitials(user.name, user.email)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-neutral-950">{displayName}</p>
                {isPaid && (
                  <span className="flex items-center gap-0.5 rounded-full bg-[#FFF8EE] px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200">
                    <Crown size={9} /> Pro
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] font-medium text-neutral-500">{user.email}</p>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-0.5 py-1.5">
            <Link
              href="/projects"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <FolderOpen size={14} className="text-neutral-500" />
              <span>Project Directory</span>
            </Link>
            <Link
              href="/billing"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <CreditCard size={14} className="text-neutral-500" />
              <span>Subscription &amp; Billing</span>
            </Link>
            <Link
              href="/design-system"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <Palette size={14} className="text-neutral-500" />
              <span>Design System</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-neutral-100" />

          {/* Proper Sign Out Section */}
          <div className="pt-1">
            {confirmSignOut ? (
              <div className="rounded-xl bg-red-50 p-2.5 text-center border border-red-200">
                <p className="text-[11px] font-bold text-red-900 mb-2">Sign out of your account?</p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmSignOut(false)}
                    className="flex-1 rounded-lg bg-white px-2 py-1.5 text-[11px] font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    {signingOut ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut size={14} />
                  <span>Log out</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-normal">End session</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive Profile Card Button */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className={`group flex w-full items-center gap-2.5 rounded-2xl p-2 text-left transition-all cursor-pointer ${
          menuOpen
            ? 'bg-neutral-100/90 ring-1 ring-neutral-200'
            : 'hover:bg-neutral-100/70'
        }`}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl as string}
            alt={displayName}
            width={36}
            height={36}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-neutral-200 shadow-2xs"
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF3EE] text-xs font-black text-[#FF3B00] border border-[#FFCCBC] shadow-2xs">
            {getInitials(user.name, user.email)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-bold text-neutral-900 group-hover:text-neutral-950 leading-tight">
              {displayName}
            </p>
            {isPaid && (
              <span className="flex items-center gap-0.5 rounded-full bg-[#FFF8EE] px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200">
                <Crown size={9} /> Pro
              </span>
            )}
          </div>
          <p className="truncate text-[11px] font-medium text-neutral-500 mt-0.5">{user.email}</p>
        </div>

        <div className="shrink-0 text-neutral-400 group-hover:text-neutral-600 transition-colors p-1">
          <ChevronsUpDown size={15} />
        </div>
      </button>
    </div>
  );
}


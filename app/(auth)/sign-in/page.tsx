'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AuthShell, GoogleButton, Input, useAuth } from '@/components';
import { insforge } from '@/lib/insforge';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await insforge.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message ?? 'Unable to sign in. Please verify your credentials.');
      setLoading(false);
      return;
    }

    await refresh();
    const next = searchParams.get('next');
    router.push(next && next.startsWith('/') ? next : '/dashboard');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage and build your Shopify storefronts."
      footer={
        <>
          Don&apos;t have an account yet?{' '}
          <Link href="/sign-up" className="font-bold text-[#FF5840] hover:underline">
            Create account free
          </Link>
        </>
      }
    >
      <GoogleButton label="Continue with Google" />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">or with email</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="merchant@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF5840] text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,88,64,0.3)] transition-all hover:bg-[#f84a30] hover:shadow-lg disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Signing in…
            </span>
          ) : (
            <>
              <span>Sign In to Builder</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Welcome back"
          subtitle="Sign in to keep building your Shopify themes."
          footer={null}
        >
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
        </AuthShell>
      }
    >
      <SignInForm />
    </Suspense>
  );
}

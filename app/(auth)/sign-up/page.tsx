'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AuthShell, GoogleButton, Input, useAuth } from '@/components';
import { insforge } from '@/lib/insforge';

const PASSWORD_MIN_LENGTH = 6;

type Step = 'form' | 'verify';

interface SignUpResult {
  accessToken?: string | null;
  requireEmailVerification?: boolean;
}

export default function SignUpPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finishSignedIn = async () => {
    await refresh();
    router.push('/dashboard');
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await insforge.auth.signUp({
      email: email.trim(),
      password,
      name: name.trim(),
      redirectTo: `${window.location.origin}/sign-in`,
    });

    if (signUpError) {
      setError(signUpError.message ?? 'Unable to create your account.');
      setLoading(false);
      return;
    }

    const result = (data ?? {}) as SignUpResult;
    if (result.accessToken) {
      await finishSignedIn();
      return;
    }

    setNotice(`We sent a 6-digit verification code to ${email.trim()}.`);
    setStep('verify');
    setLoading(false);
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await insforge.auth.verifyEmail({
      email: email.trim(),
      otp: code.trim(),
    });

    if (verifyError) {
      setError(verifyError.message ?? 'Invalid or expired code.');
      setLoading(false);
      return;
    }

    const result = (data ?? {}) as SignUpResult;
    if (!result.accessToken) {
      const { error: signInError } = await insforge.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError('Email verified. Please sign in to continue.');
        setLoading(false);
        router.push('/sign-in');
        return;
      }
    }

    await finishSignedIn();
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    const { error: resendError } = await insforge.auth.resendVerificationEmail({
      email: email.trim(),
      redirectTo: `${window.location.origin}/sign-in`,
    });
    setNotice(
      resendError ? null : `We sent a new code to ${email.trim()}.`
    );
    if (resendError) setError(resendError.message ?? 'Could not resend the code.');
  };

  if (step === 'verify') {
    return (
      <AuthShell
        title="Verify your email"
        subtitle="Enter the 6-digit code we emailed you to activate your builder account."
        footer={
          <button
            type="button"
            onClick={() => setStep('form')}
            className="font-bold text-[#FF5840] hover:underline"
          >
            ← Use a different email address
          </button>
        }
      >
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          {notice && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
              {notice}
            </p>
          )}
          <Input
            label="6-Digit Verification Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
                Verifying code…
              </span>
            ) : (
              <>
                <span>Verify &amp; Launch Studio</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors text-center"
          >
            Didn&apos;t get a code? Resend email
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start generating production-ready Shopify themes with AI."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-bold text-[#FF5840] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">or with email</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Work Email"
          type="email"
          autoComplete="email"
          placeholder="jane@brand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText={`Minimum ${PASSWORD_MIN_LENGTH} characters.`}
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
              Creating account…
            </span>
          ) : (
            <>
              <span>Create Account Free</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

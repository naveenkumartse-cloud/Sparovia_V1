'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { CheckCircle2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuth } = useAuth();
  
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const hasVerifiedRef = useRef(false);

  const verifyToken = useCallback(async (emailToVerify: string, tokenToVerify: string) => {
    setStatus('loading');
    try {
      await apiClient.post('/auth/verify-email', { email: emailToVerify, token: tokenToVerify });
      try {
        await checkAuth(); // Session cookie was established by server
      } catch {
        // Silently continue if session check has delay; email is verified
      }
      setStatus('success');
      setMessage('Your email address has been successfully verified. Let’s establish your approved Business Context.');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sparovia_dev_verify_link');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'This verification link is invalid or has expired.');
    }
  }, [checkAuth]);

  useEffect(() => {
    // Sparovia V1 now uses Phone OTP verification
    const storedPhone = typeof window !== 'undefined' ? sessionStorage.getItem('sparovia_verify_phone') : null;
    const phoneQuery = storedPhone ? `?phone=${encodeURIComponent(storedPhone)}` : '';
    router.replace(`/verify-phone${phoneQuery}`);
  }, [router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address to resend the verification link.');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const res: any = await apiClient.post('/auth/resend-verification', { email });
      if (res?.devVerificationUrl && typeof window !== 'undefined') {
        sessionStorage.setItem('sparovia_dev_verify_link', res.devVerificationUrl);
        setDevLink(res.devVerificationUrl);
      }
      setResendSuccess(true);
      setMessage('A fresh verification link has been sent to your email.');
    } catch (error: any) {
      setMessage(error.message || 'Unable to send verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-[#1E293B] max-w-md mx-auto w-full relative z-10">
      {/* SUCCESS STATE */}
      {status === 'success' && (
        <div className="text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Email Verified</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/onboarding/business-basics')}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#FF7043] hover:bg-[#F4511E] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0F172A] transition-all shadow-lg shadow-[#FF7043]/20"
          >
            Continue to Business Onboarding
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}

      {/* VERIFYING TOKEN IN PROGRESS */}
      {status === 'loading' && token && (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 border-3 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying your email...</h2>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8]">Validating your secure verification token.</p>
        </div>
      )}

      {/* ERROR STATE */}
      {status === 'error' && (
        <div className="text-center space-y-6">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Verification Failed</h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              {message}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mb-4">Request a new verification link to proceed:</p>
            <form onSubmit={handleResend} className="space-y-4 text-left">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Email Address
                </label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isResending}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-medium text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] disabled:opacity-50 transition-colors"
              >
                {isResending ? (
                  <span className="inline-flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IDLE / CHECK YOUR EMAIL STATE (arrived after registration) */}
      {status === 'idle' && !token && (
        <div className="text-center space-y-6">
          <div className="w-14 h-14 bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-[#3B82F6]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Check your email</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8]">
              We sent a verification link to:
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white text-base">
              {email || 'your email address'}
            </p>
          </div>

          {resendSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs text-center" role="alert">
              {message}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
            Click the link in the email to activate your account. If you don&apos;t see it, please check your spam folder.
          </p>

          <form onSubmit={handleResend} className="space-y-4 pt-2">
            {!emailParam && (
              <div>
                <div className="flex items-center gap-1.5 text-left">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                    Email Address
                  </label>
                  <InfoTooltip content="Enter the email address you used when creating your account." />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1.5 block w-full px-3.5 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isResending}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-medium text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] disabled:opacity-50 transition-colors"
            >
              {isResending ? (
                <span className="inline-flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending email...
                </span>
              ) : (
                'Resend Verification Email'
              )}
            </button>
          </form>

          {/* Skip Option */}
          {(process.env.NODE_ENV === 'development' || devLink) && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  if (devLink) {
                    window.location.href = devLink;
                  } else {
                    router.push('/admin/onboarding/business-basics');
                  }
                }}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors underline underline-offset-4"
              >
                Skip verification &amp; continue to onboarding &rarr;
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B] flex justify-between items-center text-xs">
            <Link href="/login" className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-medium">
              Back to Sign In
            </Link>
            <Link href="/register" className="text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors">
              Re-register
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#3B82F6]/10 to-[#8B3FD1]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <Link href="/" className="inline-block">
          <span className="text-3xl font-extrabold text-brand-gradient tracking-tight">
            SPAROVIA
          </span>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center text-slate-500 dark:text-[#94A3B8] text-sm">Loading verification...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}

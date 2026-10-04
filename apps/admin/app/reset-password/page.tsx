'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMissingToken, setIsMissingToken] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    const queryToken = searchParams.get('token');
    
    if (!queryEmail || !queryToken) {
      setIsMissingToken(true);
      setError('This password reset link is invalid or has expired. Please request a new reset link.');
    } else {
      setEmail(queryEmail);
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      const msg = "The password and confirmation password do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiClient.post<any>('/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword
      });
      const msg = data.message || 'Your password has been reset successfully.';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const msg = err.message || 'Failed to reset password. The link may have expired.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMissingToken) {
    return (
      <div className="bg-white dark:bg-[#0F172A] py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-[#1E293B] text-center space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invalid Reset Link</h2>
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm">
          {error}
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] transition-colors"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-[#1E293B]">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Set New Password
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8]">
          Create a secure new password for your account
        </p>
      </div>
      
      {error && (
        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {success ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            {success} Redirecting to login...
          </p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} method="POST">
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                New Password
              </label>
              <InfoTooltip content="Must be at least 8 characters long. Use letters, numbers, and symbols for high security." />
            </div>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors focus:outline-none"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Confirm New Password
              </label>
              <InfoTooltip content="Re-enter your new password to verify matching values." />
            </div>
            <div className="mt-1.5 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Resetting Password..."
              rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
            >
              Reset Password
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B] text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-xs font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#3B82F6]/10 to-[#8B3FD1]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <Link href="/" className="inline-block mb-4">
          <span className="text-3xl font-extrabold text-brand-gradient tracking-tight">
            SPAROVIA
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Suspense fallback={<div className="text-center text-[#94A3B8] text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

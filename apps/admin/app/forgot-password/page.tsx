'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';

import { isValidEmail } from '@/lib/validation/authValidation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiClient.post<any>('/auth/forgot-password', { email });
      const msg = data.message || 'If an account exists, a password reset link has been sent.';
      setSuccess(msg);
      toast.success(msg);
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8]">
          Enter your registered email and we’ll send a secure reset link
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#0F172A] py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-[#1E293B]">
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">
                {success}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Check your inbox and spam folder for instructions to reset your password.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} method="POST">
              <div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                    Email Address
                  </label>
                  <InfoTooltip content="Enter the email address you registered with. We will send a secure reset link." />
                </div>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={256}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error && isValidEmail(e.target.value)) {
                        setError('');
                      }
                    }}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  />
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
                  loadingText="Sending..."
                  rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
                >
                  Send Reset Link
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B] text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { checkAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/login', { email, password });
      const me: any = await apiClient.get('/auth/me');
      await checkAuth(); // Refresh the AuthContext
      toast.success('Signed in successfully.');
      if (!me?.isOnboardingConfirmed) {
        router.push('/admin/onboarding/business-basics');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'We couldn’t sign you in. Please check your details and try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#3B82F6]/10 to-[#8B3FD1]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-block mb-4">
          <span className="text-3xl font-extrabold text-brand-gradient tracking-tight">
            SPAROVIA
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8]">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#0F172A] py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-[#1E293B]">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm space-y-2" role="alert">
                <p>{error}</p>
                {error.toLowerCase().includes("verify your email") && (
                  <div>
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="text-[#3B82F6] hover:text-[#60A5FA] underline text-xs font-semibold inline-flex items-center"
                    >
                      Go to email verification
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Work Email
                </label>
                <InfoTooltip content="Enter the email address associated with your Sparovia account." />
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
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
                loadingText="Signing in..."
                rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#1E293B] text-center">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              New to Sparovia?{' '}
              <Link
                href="/register"
                className="font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

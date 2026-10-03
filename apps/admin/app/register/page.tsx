'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setGlobalError(null);
      const response: any = await apiClient.post('/auth/register', data);
      
      // Store dev verification link in session if returned by backend in Development mode
      if (response?.devVerificationUrl && typeof window !== 'undefined') {
        sessionStorage.setItem('sparovia_dev_verify_link', response.devVerificationUrl);
      }

      toast.success('Registration successful! Please verify your email.');
      // Authoritative Admin flow: navigate to Admin verify-email with email parameter
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      const msg = error.message || 'An unexpected error occurred. Please try again.';
      setGlobalError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col justify-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-[#3B82F6]/10 to-[#8B3FD1]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-block mb-1.5 sm:mb-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-brand-gradient tracking-tight">
            SPAROVIA
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
          Set up your workspace to establish your business presence
        </p>
      </div>

      <div className="mt-5 sm:mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#0F172A] py-5 px-5 sm:py-6 sm:px-8 shadow-xl dark:shadow-2xl rounded-2xl border border-slate-200 dark:border-[#1E293B]">
          <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {globalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start space-x-2" role="alert">
                <span className="text-red-500 dark:text-red-400 font-bold">Error:</span>
                <span>{globalError}</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Full Name
                </label>
                <InfoTooltip content="Enter your legal name or primary business contact name." />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Jane Doe"
                  {...register('fullName')}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  aria-invalid={errors.fullName ? "true" : "false"}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Work Email
                </label>
                <InfoTooltip content="A verification link will be sent here to activate your workspace." />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  {...register('email')}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  aria-invalid={errors.email ? "true" : "false"}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Password
                </label>
                <InfoTooltip content="Must be at least 8 characters long. Numbers or symbols recommended." />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="block w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">{errors.password.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Confirm Password
                </label>
                <InfoTooltip content="Re-enter your password to ensure there are no typos." />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="block w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start pt-0.5">
              <input
                id="acceptedTerms"
                type="checkbox"
                {...register('acceptedTerms')}
                className="mt-0.5 h-3.5 w-3.5 text-[#3B82F6] focus:ring-[#3B82F6] border-slate-300 dark:border-[#334155] rounded bg-white dark:bg-[#0B1220]"
              />
              <label htmlFor="acceptedTerms" className="ml-2 block text-xs text-slate-600 dark:text-[#94A3B8] leading-tight">
                I accept the terms and conditions and agree to receive transactional notifications.
              </label>
            </div>
            {errors.acceptedTerms && (
              <p className="text-xs text-red-500 dark:text-red-400" role="alert">{errors.acceptedTerms.message}</p>
            )}

            <div className="pt-1.5">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Creating account..."
                rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#1E293B] text-center">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

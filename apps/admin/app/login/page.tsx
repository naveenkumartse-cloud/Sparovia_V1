'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Smartphone,
  User,
  CheckCircle2,
} from 'lucide-react';
import {
  cleanPhoneInput,
  isValidIndianPhone,
  isValidEmail,
  detectIdentifierType,
  handlePhoneKeyDown,
  handlePhonePaste,
} from '@/lib/validation/authValidation';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [identifierTouched, setIdentifierTouched] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { checkAuth } = useAuth();

  const identifierType = detectIdentifierType(identifier);
  const isPhoneMode = identifierType === 'phone';
  const isEmailMode = identifierType === 'email';

  // Real-time valid state for visual feedback
  const isIdentifierValid =
    (isPhoneMode && isValidIndianPhone(identifier)) ||
    (isEmailMode && isValidEmail(identifier));

  // Focus management on step change
  useEffect(() => {
    if (step === 1) {
      identifierInputRef.current?.focus();
    } else if (step === 2) {
      passwordInputRef.current?.focus();
    }
  }, [step]);

  // Handle password manager autofill: if browser fills password while on step 1, advance to step 2
  const handlePasswordAutofill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (val && step === 1 && identifier.trim() && isIdentifierValid) {
      setStep(2);
    }
  };

  const validateIdentifier = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Enter your email or phone number.';
    }
    const type = detectIdentifierType(trimmed);
    if (type === 'phone') {
      if (!isValidIndianPhone(trimmed)) {
        return 'Enter a valid 10-digit phone number.';
      }
    } else {
      if (!isValidEmail(trimmed)) {
        return 'Enter a valid email address.';
      }
    }
    return null;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;

    if (/^\d/.test(rawVal.trim())) {
      // In phone mode: clean to digits only and limit to 10
      const cleaned = cleanPhoneInput(rawVal);
      setIdentifier(cleaned);
      if (identifierTouched) {
        if (isValidIndianPhone(cleaned)) {
          setFieldError('');
        }
      }
    } else {
      // In email mode: allow normal email characters
      setIdentifier(rawVal);
      if (identifierTouched) {
        if (isValidEmail(rawVal)) {
          setFieldError('');
        }
      }
    }
  };

  const handleIdentifierBlur = () => {
    setIdentifierTouched(true);
    if (identifier.trim()) {
      const err = validateIdentifier(identifier);
      if (err) {
        setFieldError(err);
      } else {
        setFieldError('');
      }
    }
  };

  const handleContinue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIdentifierTouched(true);
    setError('');

    const err = validateIdentifier(identifier);
    if (err) {
      setFieldError(err);
      identifierInputRef.current?.focus();
      return;
    }

    setFieldError('');
    setStep(2);
  };

  const handleBackToIdentifier = () => {
    setStep(1);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      handleContinue(e);
      return;
    }

    if (!password) {
      setError('Enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        email: identifier.trim(),
        identifier: identifier.trim(),
        password,
      };

      await apiClient.post('/auth/login', payload);
      const me: any = await apiClient.get('/auth/me');
      await checkAuth(); // Refresh the AuthContext
      toast.success('Signed in successfully.');

      if (!me?.isOnboardingConfirmed) {
        router.push('/admin/onboarding/business-basics');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      const genericMsg = "We couldn't sign you in with those details.";
      const errorMsg = err.message || genericMsg;
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#3B82F6]/10 to-[#8B3FD1]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-block mb-3 sm:mb-4">
          <span className="text-2xl sm:text-3xl font-extrabold text-brand-gradient tracking-tight">
            SPAROVIA
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
          {step === 1
            ? 'Sign in with your email address or phone number'
            : 'Enter your password to access your workspace'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#0F172A] py-6 sm:py-8 px-5 sm:px-8 shadow-xl dark:shadow-2xl rounded-2xl border border-slate-200 dark:border-[#1E293B]">
          <form className="space-y-4 sm:space-y-5" onSubmit={handleLogin} method="POST">
            {error && (
              <div
                className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-xs sm:text-sm space-y-2"
                role="alert"
              >
                <p>{error}</p>
                {error.toLowerCase().includes('verify') && (
                  <div>
                    <Link
                      href={`/verify-phone?phone=${encodeURIComponent(identifier)}`}
                      className="text-[#3B82F6] hover:text-[#60A5FA] underline text-xs font-semibold inline-flex items-center"
                    >
                      Go to verification
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: IDENTIFIER INPUT */}
            {step === 1 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="identifier"
                      className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]"
                    >
                      Email or Phone Number
                    </label>
                    <InfoTooltip content="Enter your registered work email address or your 10-digit Indian phone number." />
                  </div>
                  {isPhoneMode && (
                    <span className="text-[11px] font-medium text-[#3B82F6] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      10-digit mobile
                    </span>
                  )}
                  {isEmailMode && (
                    <span className="text-[11px] font-medium text-[#8B3FD1] bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                      Email
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                    {isPhoneMode ? (
                      <Smartphone className="h-4 w-4 text-[#3B82F6]" />
                    ) : isEmailMode ? (
                      <Mail className="h-4 w-4 text-[#8B3FD1]" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    ref={identifierInputRef}
                    id="identifier"
                    name="email"
                    type={isPhoneMode ? 'tel' : 'text'}
                    inputMode={isPhoneMode ? 'numeric' : 'email'}
                    autoComplete="username"
                    required
                    maxLength={isPhoneMode ? 10 : 120}
                    value={identifier}
                    onKeyDown={isPhoneMode ? handlePhoneKeyDown : undefined}
                    onPaste={
                      isPhoneMode
                        ? (e) =>
                            handlePhonePaste(e, (cleanVal) => {
                              setIdentifier(cleanVal);
                              if (isValidIndianPhone(cleanVal)) {
                                setFieldError('');
                              }
                            })
                        : undefined
                    }
                    onChange={handleIdentifierChange}
                    onBlur={handleIdentifierBlur}
                    placeholder="name@example.com or 9876543210"
                    className={`block w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#0B1220] border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors ${
                      fieldError
                        ? 'border-red-500/60 dark:border-red-500/60'
                        : isIdentifierValid
                        ? 'border-emerald-500/60 dark:border-emerald-500/60'
                        : 'border-slate-200 dark:border-[#334155]'
                    }`}
                    aria-invalid={fieldError ? 'true' : 'false'}
                    aria-describedby={fieldError ? 'identifier-error' : undefined}
                  />
                  {isIdentifierValid && !fieldError && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>
                {fieldError && (
                  <p id="identifier-error" className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
                    {fieldError}
                  </p>
                )}

                {/* Password field kept in DOM for browser password manager / autofill detection */}
                <div className="sr-only" aria-hidden="true">
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    tabIndex={-1}
                    value={password}
                    onChange={handlePasswordAutofill}
                  />
                </div>

                <div className="pt-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                    rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: PASSWORD INPUT */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Active Identifier Pill with Change Button */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-1.5 bg-blue-500/10 text-[#3B82F6] rounded-lg">
                      {isPhoneMode ? <Smartphone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {identifier}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToIdentifier}
                    className="text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                  >
                    Change
                  </button>
                </div>

                {/* Hidden username input in form for browser password manager compliance */}
                <input
                  type="hidden"
                  name="email"
                  value={identifier}
                  autoComplete="username"
                />

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                      aria-invalid={error ? 'true' : 'false'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              </div>
            )}
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#1E293B] text-center">
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

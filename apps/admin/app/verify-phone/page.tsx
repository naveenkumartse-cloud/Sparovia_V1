'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  ShieldCheck,
  Smartphone,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  const last4 = digits.slice(-4);
  const prefix = phone.startsWith('+') ? phone.slice(0, 3) : '';
  return `${prefix} ******${last4}`;
}

function VerifyPhoneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuth } = useAuth();

  const phoneParam = searchParams.get('phone') || '';
  const [phoneNumber, setPhoneNumber] = useState(phoneParam);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Cooldown timer state for resend (60s)
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize phone number and dev OTP from storage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPhone = sessionStorage.getItem('sparovia_verify_phone');
      if (!phoneNumber && storedPhone) {
        setPhoneNumber(storedPhone);
      }
      const storedDevOtp = sessionStorage.getItem('sparovia_dev_otp');
      if (storedDevOtp) {
        setDevOtp(storedDevOtp);
      }
    }
  }, [phoneNumber]);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const fullOtp = otpDigits.join('');

  const handleInputChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1); // Take latest entered character
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setErrorMessage(null);

    // Auto advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...otpDigits];
        updated[index] = '';
        setOtpDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasteData[i] || '';
    }
    setOtpDigits(updated);
    setErrorMessage(null);

    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleFillDevOtp = () => {
    if (!devOtp || devOtp.length !== 6) return;
    const digits = devOtp.split('');
    setOtpDigits(digits);
    setErrorMessage(null);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }
    if (!phoneNumber) {
      setErrorMessage('Phone number is missing. Please return to registration.');
      return;
    }

    setStatus('verifying');
    setErrorMessage(null);

    try {
      const response: any = await apiClient.post('/auth/phone/verify-otp', {
        phoneNumber,
        otp: fullOtp,
      });

      const token = response?.accessToken || response?.data?.accessToken;
      if (token) {
        apiClient.setToken(token);
      }

      setStatus('success');
      toast.success('Phone verified successfully!');

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sparovia_dev_otp');
        sessionStorage.removeItem('sparovia_verify_phone');
      }

      // Check auth state so user context updates
      try {
        await checkAuth();
      } catch {
        // Continue if delayed; cookie is set
      }

      const nextUrl = response?.data?.nextUrl || response?.nextUrl || '/admin/onboarding/business-basics';
      setTimeout(() => {
        router.push(nextUrl);
      }, 1000);
    } catch (error: any) {
      setStatus('error');
      const msg = error.message || 'Invalid or expired verification code. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
      // Clear inputs for retry
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!phoneNumber) {
      setErrorMessage('Phone number is missing. Please return to registration.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res: any = await apiClient.post('/auth/phone/send-otp', {
        phoneNumber,
      });

      const resData = res?.data || res;
      if (resData?.devOtp) {
        setDevOtp(resData.devOtp);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sparovia_dev_otp', resData.devOtp);
        }
      }

      setCooldown(resData?.cooldownSeconds || 60);
      toast.success('A new verification code has been sent to your phone.');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const msg = error.message || 'Unable to resend verification code. Please wait and try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] py-7 px-5 sm:py-8 sm:px-8 shadow-xl dark:shadow-2xl rounded-2xl border border-slate-200 dark:border-[#1E293B] max-w-md mx-auto w-full relative z-10">
      {/* SUCCESS STATE */}
      {status === 'success' ? (
        <div className="text-center space-y-5 py-4">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Phone Verified!
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-[#94A3B8]">
              Your account has been authenticated. Redirecting to Business Setup...
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* HEADER */}
          <div className="text-center">
            <div className="w-13 h-13 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-3.5">
              <Smartphone className="w-7 h-7 text-[#3B82F6]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Verify your Phone
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
              We sent a 6-digit verification code to
            </p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
              {phoneNumber ? maskPhoneNumber(phoneNumber) : 'your registered number'}
            </p>
          </div>

          {/* OTP HELPER CARD FOR PILOT / TESTING */}
          {devOtp && (
            <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Verification Code (Pilot Mode)
                </span>
                <button
                  type="button"
                  onClick={handleFillDevOtp}
                  className="px-2 py-0.5 bg-amber-500 text-white rounded font-medium text-[11px] hover:bg-amber-600 transition-colors"
                >
                  Fill Code
                </button>
              </div>
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-200">
                <span>Verification Code:</span>
                <span className="font-mono font-bold text-sm tracking-widest bg-amber-500/20 px-2 py-0.5 rounded">
                  {devOtp}
                </span>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start space-x-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OTP FORM */}
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0] text-center mb-3">
                Enter 6-digit verification code
              </label>

              {/* 6 Digit Input Slots */}
              <div className="flex justify-between items-center gap-1.5 sm:gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30 transition-all caret-[#3B82F6]"
                    autoComplete="one-time-code"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* VERIFY BUTTON */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              disabled={fullOtp.length !== 6 || status === 'verifying'}
              isLoading={status === 'verifying'}
              loadingText="Verifying code..."
              rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
            >
              Verify Code
            </Button>
          </form>

          {/* RESEND & COOLDOWN */}
          <div className="pt-2 text-center space-y-3">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Didn&apos;t receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="inline-flex items-center text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] disabled:text-slate-400 dark:disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sending new code...
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                  Resend code in {cooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Resend verification code
                </>
              )}
            </button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B] flex justify-between items-center text-xs">
            <Link
              href="/register"
              className="text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Change number
            </Link>
            <Link
              href="/login"
              className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
        <VerifyPhoneContent />
      </Suspense>
    </div>
  );
}

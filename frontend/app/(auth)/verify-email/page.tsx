'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get('email') || '';
  
  // We grab the email from sessionStorage if it was stored there during registration,
  // or fallback to searchParams (which might be manipulated, but the backend rate limits anyway).
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // In a real app with full state management, email would come from a secure context.
    const storedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('registeredEmail') : null;
    setEmail(storedEmail || emailParam);
  }, [emailParam]);

  const handleResend = async () => {
    if (!email) {
      setResendStatus('error');
      setErrorMessage('No email address found to resend to. Please sign in or register again.');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to resend verification email.');
      }

      setResendStatus('success');
    } catch (error: any) {
      setResendStatus('error');
      setErrorMessage(error.message || 'A network error occurred.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            Verify your email
            <InfoIcon 
              id="verify-email-info" 
              content="Verify your email to confirm that you have access to this account. You must complete verification before continuing to protected Sparovia functionality." 
            />
          </h2>
          <div className="mt-4 text-sm text-gray-600">
            We&apos;ve sent a verification link to:
            <div className="font-semibold text-gray-900 mt-1">{email || 'your email address'}</div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Check your inbox and click the verification link to continue.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-600 mb-4">Didn&apos;t receive the email?</p>
          
          {resendStatus === 'success' && (
            <div className="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm">
              Verification email sent.
            </div>
          )}
          
          {resendStatus === 'error' && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <div className="mt-6">
          <Link href="/sign-in" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

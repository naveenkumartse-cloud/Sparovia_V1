'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { InfoIcon } from '@/components/ui/InfoIcon';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already_verified'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If the authentication provider uses hash fragments (like Supabase implicit flow),
    // we would parse window.location.hash here. We will support standard query params first.
    let token = searchParams?.get('token') || searchParams?.get('code');

    // Supabase often puts it in the hash if not using PKCE
    if (!token && typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      token = hashParams.get('access_token');
    }

    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('That verification link is invalid or can no longer be used.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setVerificationStatus('success');
        } else {
          const data = await response.json().catch(() => null);
          const msg = data?.message?.toLowerCase() || '';

          if (msg.includes('expired')) {
            setVerificationStatus('expired');
          } else if (msg.includes('already verified') || msg.includes('already_verified')) {
            setVerificationStatus('already_verified');
          } else {
            setVerificationStatus('error');
            setErrorMessage('That verification link is invalid or can no longer be used.');
          }
        }
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage('A network error occurred while verifying your email.');
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow text-center">
        
        {verificationStatus === 'loading' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying your email...</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Email verified successfully</h2>
            <div className="p-4 bg-green-50 text-green-700 rounded-md mb-6">
              Your email has been verified. You can now continue to Sparovia.
            </div>
            <button
              onClick={() => router.push('/sign-in')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Continue
            </button>
          </div>
        )}

        {verificationStatus === 'already_verified' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              Already Verified
              <InfoIcon id="already-verified-info" content="Your account was previously verified. You do not need to verify it again." />
            </h2>
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md mb-6">
              Your email is already verified.
            </div>
            <button
              onClick={() => router.push('/sign-in')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Continue to Sign In
            </button>
          </div>
        )}

        {verificationStatus === 'expired' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h2>
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md mb-6 text-sm">
              That verification link has expired.
            </div>
            <Link 
              href="/verify-email"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              Request New Verification Email
            </Link>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
            <div className="p-4 bg-red-50 text-red-700 rounded-md mb-6 text-sm">
              {errorMessage}
            </div>
            <div className="space-y-4">
              <Link 
                href="/verify-email"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              >
                Request New Verification Email
              </Link>
              <div>
                <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Go to Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

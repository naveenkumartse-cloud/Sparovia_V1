'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SettingsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab') || 'settings';
    router.replace(`/admin/account?tab=${tab}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Opening Settings...</p>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-gray-100 my-8 w-full', className)} />;
}

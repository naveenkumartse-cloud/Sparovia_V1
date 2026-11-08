'use client';

import React, { createContext, useContext, useId } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  baseId: string;
  variant?: 'line' | 'pills' | 'creative';
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  variant?: 'line' | 'pills' | 'creative';
  className?: string;
}

export function Tabs({
  value,
  onValueChange,
  children,
  variant = 'line',
  className,
}: TabsProps) {
  const baseId = useId();

  return (
    <TabsContext.Provider value={{ value, onValueChange, baseId, variant }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  ariaLabel?: string;
}

export function TabsList({ className, children, ariaLabel = 'Navigation tabs', ...props }: TabsListProps) {
  const context = useContext(TabsContext);
  const variant = context?.variant || 'line';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center overflow-x-auto no-scrollbar scroll-smooth',
        variant === 'line' &&
          'border-b border-[#CBD5E1] dark:border-[#1E293B] gap-1 sm:gap-2',
        variant === 'pills' &&
          'bg-[#F3F6FA] dark:bg-[#0B1220] p-1 rounded-[6px] border border-[#E3E7ED] dark:border-[#1E293B] gap-1',
        variant === 'creative' &&
          'bg-[#F5F0FB]/60 dark:bg-[#1A102A]/60 p-1 rounded-[6px] border border-[#7950B8]/20 gap-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export function TabsTrigger({
  value,
  badge,
  icon,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const { value: selectedValue, onValueChange, baseId, variant } = context;
  const isSelected = selectedValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      role="tab"
      type="button"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-semibold transition-all select-none outline-none shrink-0',
        'focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2',
        variant === 'line' && [
          'relative px-3.5 sm:px-5 py-3 -mb-px border-b-2',
          isSelected
            ? 'border-[#315FEA] text-[#315FEA] dark:text-[#608FFE]'
            : 'border-transparent text-[#475569] hover:text-[#172033] hover:border-[#CBD5E1] dark:text-[#94A3B8] dark:hover:text-white',
        ],
        variant === 'pills' && [
          'px-3 sm:px-4 py-2 rounded-[4px]',
          isSelected
            ? 'bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white shadow-soft-xs font-bold border border-[#CBD5E1]/60 dark:border-[#334155]/60'
            : 'text-[#475569] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:text-white',
        ],
        variant === 'creative' && [
          'px-3 sm:px-4 py-2 rounded-[4px]',
          isSelected
            ? 'bg-white dark:bg-[#1A102A] text-[#7950B8] dark:text-[#C4B5FD] shadow-soft-xs font-bold border border-[#7950B8]/30'
            : 'text-[#64748B] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:text-white',
        ],
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2 inline-flex items-center">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="ml-2 inline-flex items-center">{badge}</span>}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const { value: selectedValue, baseId } = context;
  const isSelected = selectedValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn('outline-none mt-4 sm:mt-6 animate-in fade-in-50 duration-150', className)}
      {...props}
    >
      {children}
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Sparkles,
  PhoneCall,
  Award,
  CheckCheck,
} from 'lucide-react';
import { LeadStatus } from './LeadTypes';

export interface StatusCounts {
  all: number;
  new: number;
  contacted: number;
  qualified: number;
  closed: number;
}

interface StatusSummaryCardsProps {
  selectedStatus: LeadStatus;
  onSelectStatus: (status: LeadStatus) => void;
  counts: StatusCounts;
  isLoading?: boolean;
}

interface CardConfig {
  key: LeadStatus;
  label: string;
  count: number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  activeRingClass: string;
  activeBgClass: string;
  activeBorderClass: string;
  badge?: string;
  badgeColorClass?: string;
}

export function StatusSummaryCards({
  selectedStatus,
  onSelectStatus,
  counts,
  isLoading = false,
}: StatusSummaryCardsProps) {
  const cards: CardConfig[] = [
    {
      key: 'All',
      label: 'All Enquiries',
      count: counts.all,
      icon: <Users className="w-4 h-4" />,
      iconBgClass: 'bg-[#315FEA]/10 text-[#315FEA]',
      iconColorClass: 'text-[#315FEA]',
      activeRingClass: 'ring-2 ring-[#315FEA]/30',
      activeBgClass: 'bg-gradient-to-b from-[#315FEA]/5 to-transparent',
      activeBorderClass: 'border-[#315FEA]',
    },
    {
      key: 'New',
      label: 'New Leads',
      count: counts.new,
      icon: <Sparkles className="w-4 h-4" />,
      iconBgClass: 'bg-[#15803D]/10 text-[#15803D]',
      iconColorClass: 'text-[#15803D]',
      activeRingClass: 'ring-2 ring-[#15803D]/30',
      activeBgClass: 'bg-gradient-to-b from-[#15803D]/5 to-transparent',
      activeBorderClass: 'border-[#15803D]',
      badge: counts.new > 0 ? 'Needs attention' : undefined,
      badgeColorClass: 'bg-[#15803D]/10 text-[#15803D] dark:text-emerald-400 border border-[#15803D]/20',
    },
    {
      key: 'Contacted',
      label: 'Contacted',
      count: counts.contacted,
      icon: <PhoneCall className="w-4 h-4" />,
      iconBgClass: 'bg-[#315FEA]/10 text-[#315FEA]',
      iconColorClass: 'text-[#315FEA]',
      activeRingClass: 'ring-2 ring-[#315FEA]/30',
      activeBgClass: 'bg-gradient-to-b from-[#315FEA]/5 to-transparent',
      activeBorderClass: 'border-[#315FEA]',
    },
    {
      key: 'Qualified',
      label: 'Qualified',
      count: counts.qualified,
      icon: <Award className="w-4 h-4" />,
      iconBgClass: 'bg-[#F0EAFE] text-[#7950B8] dark:bg-[#7950B8]/20 dark:text-[#A78BFA]',
      iconColorClass: 'text-[#7950B8]',
      activeRingClass: 'ring-2 ring-[#7950B8]/30',
      activeBgClass: 'bg-gradient-to-b from-[#7950B8]/8 to-transparent',
      activeBorderClass: 'border-[#7950B8]',
      badge: counts.qualified > 0 ? 'Verified' : undefined,
      badgeColorClass: 'bg-[#F0EAFE] text-[#7950B8] dark:bg-[#7950B8]/20 dark:text-purple-300 border border-[#7950B8]/20',
    },
    {
      key: 'Closed',
      label: 'Closed',
      count: counts.closed,
      icon: <CheckCheck className="w-4 h-4" />,
      iconBgClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      iconColorClass: 'text-slate-600 dark:text-slate-300',
      activeRingClass: 'ring-2 ring-slate-400/30',
      activeBgClass: 'bg-gradient-to-b from-slate-500/5 to-transparent',
      activeBorderClass: 'border-slate-500 dark:border-slate-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.key;
        return (
          <motion.button
            key={card.key}
            type="button"
            onClick={() => onSelectStatus(card.key)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`relative p-3 sm:p-3.5 rounded-[8px] border text-left transition-all duration-200 select-none shadow-soft-xs hover:shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-[#7950B8]/40 ${
              isSelected
                ? `${card.activeBorderClass} ${card.activeBgClass} ${card.activeRingClass} bg-white dark:bg-[#0F172A]`
                : 'bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            aria-pressed={isSelected}
            aria-label={`Filter by ${card.label}, ${card.count} enquiries`}
          >
            {/* Top row: Icon and Optional Attention Badge */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div
                className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 font-medium ${card.iconBgClass}`}
              >
                {card.icon}
              </div>
              {card.badge && (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${card.badgeColorClass}`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            {/* Bottom info: Count & Label */}
            <div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  card.count
                )}
              </div>
              <div
                className={`text-xs font-medium truncate mt-0.5 ${
                  isSelected
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {card.label}
              </div>
            </div>

            {/* Subtle Active Accent Dot on Top Right */}
            {isSelected && (
              <span
                className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                  card.key === 'Qualified'
                    ? 'bg-[#7950B8]'
                    : card.key === 'New'
                    ? 'bg-[#15803D]'
                    : card.key === 'Closed'
                    ? 'bg-slate-500'
                    : 'bg-[#315FEA]'
                }`}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

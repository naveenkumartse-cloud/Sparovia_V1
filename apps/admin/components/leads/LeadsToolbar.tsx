'use client';

import React from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { SOURCE_OPTIONS, LeadSource, SortOption } from './LeadTypes';

interface LeadsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  sourceFilter: LeadSource;
  onSourceFilterChange: (source: LeadSource) => void;
  sortOrder: SortOption;
  onSortOrderChange: (sort: SortOption) => void;
  statusFilter: string;
  onStatusFilterReset: () => void;
  onResetAll: () => void;
  hasActiveFilters: boolean;
}

export function LeadsToolbar({
  search,
  onSearchChange,
  onClearSearch,
  sourceFilter,
  onSourceFilterChange,
  sortOrder,
  onSortOrderChange,
  statusFilter,
  onStatusFilterReset,
  onResetAll,
  hasActiveFilters,
}: LeadsToolbarProps) {
  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-[8px] p-3 sm:p-3.5 shadow-soft-xs border border-slate-200/90 dark:border-slate-800 space-y-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-2.5 items-center">
        {/* Search Input: Full width on mobile, 6 cols on desktop */}
        <div className="col-span-2 lg:col-span-6">
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onClearSearch}
            placeholder="Search by customer name, phone, or email..."
            aria-label="Search customer leads"
          />
        </div>

        {/* Source Filter Dropdown: 1 col on mobile, 3 cols on desktop */}
        <div className="col-span-1 lg:col-span-3 flex items-center gap-1.5">
          <label htmlFor="source-filter-select" className="text-xs text-slate-500 font-medium shrink-0 hidden sm:inline">
            Source:
          </label>
          <select
            id="source-filter-select"
            value={sourceFilter}
            onChange={(e) => onSourceFilterChange(e.target.value as LeadSource)}
            className="w-full h-10 py-2 px-2.5 text-xs rounded-[6px] bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7950B8]/40 focus:border-[#7950B8] shadow-soft-xs transition-colors"
            aria-label="Filter by intake source channel"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Sources' : opt}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order Dropdown: 1 col on mobile, 3 cols on desktop */}
        <div className="col-span-1 lg:col-span-3 flex items-center gap-1.5">
          <label htmlFor="sort-order-select" className="text-xs text-slate-500 font-medium shrink-0 hidden sm:inline">
            Sort:
          </label>
          <select
            id="sort-order-select"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as SortOption)}
            className="w-full h-10 py-2 px-2.5 text-xs rounded-[6px] bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7950B8]/40 focus:border-[#7950B8] shadow-soft-xs transition-colors"
            aria-label="Sort leads order"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Recently updated</option>
            <option value="name">Customer name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            Active:
          </span>

          {search.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] dark:text-[#6085FF] font-medium border border-[#315FEA]/20">
              Keyword: &quot;{search.trim()}&quot;
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Remove search filter"
                className="hover:text-slate-900 dark:hover:text-white ml-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusFilter !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#F0EAFE] text-[#7950B8] dark:bg-[#7950B8]/20 dark:text-[#A78BFA] font-medium border border-[#7950B8]/20">
              Status: {statusFilter}
              <button
                type="button"
                onClick={onStatusFilterReset}
                aria-label="Remove status filter"
                className="hover:text-slate-900 dark:hover:text-white ml-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {sourceFilter !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              Source: {sourceFilter}
              <button
                type="button"
                onClick={() => onSourceFilterChange('All')}
                aria-label="Remove source filter"
                className="hover:text-slate-900 dark:hover:text-white ml-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1 text-[#7950B8] hover:text-[#6820AB] dark:text-[#A78BFA] font-semibold text-xs ml-auto transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}
    </div>
  );
}

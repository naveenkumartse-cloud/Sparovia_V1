'use client';

import React from 'react';
import { cleanPhoneInput, handlePhoneKeyDown, handlePhonePaste, isValidIndianPhone } from '@/lib/validation/authValidation';

export interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  className?: string;
  autoFocus?: boolean;
  autoComplete?: string;
}

/**
 * Universal Indian mobile phone input with fixed, non-editable '+91' prefix.
 * Enforces strict 10 digits (starting with 6, 7, 8, 9), rejects letters/symbols/spaces,
 * safely handles paste (stripping country code and non-digits), and is fully responsive.
 */
export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'phone',
  name = 'phone',
  value,
  onChange,
  onBlur,
  label,
  placeholder = '9876543210',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  autoFocus = false,
  autoComplete = 'tel',
}) => {
  // Ensure the controlled value only contains up to 10 digits
  const rawDigits = cleanPhoneInput(value);
  const isValid = rawDigits.length === 10 && isValidIndianPhone(rawDigits);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanPhoneInput(e.target.value);
    onChange(cleaned);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    handlePhonePaste(e, (cleanVal) => {
      onChange(cleanVal);
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
            {label} {required && <span className="text-[#FF7043]">*</span>}
          </label>
          <span className="text-[11px] text-slate-400 dark:text-[#64748B]">
            10-digit mobile
          </span>
        </div>
      )}

      {/* Input Group with Fixed +91 Prefix */}
      <div
        className={`relative flex items-stretch w-full rounded-xl border bg-slate-50 dark:bg-[#0B1220] transition-colors focus-within:ring-1 focus-within:ring-[#3B82F6] focus-within:border-[#3B82F6] ${
          error
            ? 'border-red-500/60 dark:border-red-500/60'
            : isValid
            ? 'border-emerald-500/60 dark:border-emerald-500/60'
            : 'border-slate-200 dark:border-[#334155]'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Fixed, Disabled +91 Country Code Badge */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-[#1E293B]/70 text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm select-none rounded-l-xl border-r border-slate-200 dark:border-[#334155]"
        >
          <span className="tracking-wide">+91</span>
        </div>

        {/* 10-Digit Phone Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={10}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={rawDigits}
          onKeyDown={handlePhoneKeyDown}
          onPaste={handlePaste}
          onChange={handleInputChange}
          onBlur={onBlur}
          className="block w-full min-w-0 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none disabled:cursor-not-allowed"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-slate-500 dark:text-[#94A3B8]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

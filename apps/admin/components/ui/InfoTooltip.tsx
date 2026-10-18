'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface InfoTooltipProps {
  content: string;
  align?: 'left' | 'right' | 'center';
}

export function InfoTooltip({ content, align = 'left' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right' | 'center'>(align);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close on outside click or touch
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  // Adjust alignment if near viewport edge
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      if (align === 'left' && spaceRight < 270 && rect.right > 270) {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign(align);
      }
    }
  }, [isVisible, align]);

  // Alignment classes for the popover overlay
  const alignmentClass = 
    effectiveAlign === 'left' 
      ? 'left-0' 
      : effectiveAlign === 'center' 
        ? 'left-1/2 -translate-x-1/2' 
        : 'right-0';

  const arrowClass =
    effectiveAlign === 'left'
      ? 'left-2'
      : effectiveAlign === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'right-2';

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex items-center text-left shrink-0"
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
          setIsVisible(true);
        }
      }}
      onMouseLeave={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
          setIsVisible(false);
        }
      }}
    >
      <button 
        type="button" 
        onClick={() => setIsVisible(!isVisible)}
        onFocus={() => setIsVisible(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsVisible(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setIsVisible(false);
          }
        }}
        className="text-[#64748B] hover:text-[#172033] dark:hover:text-[#CBD5E1] focus:text-[#315FEA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-[4px] p-1.5 -m-1 inline-flex items-center justify-center min-h-[32px] min-w-[32px] transition-colors touch-manipulation"
        aria-label="Field information"
        aria-expanded={isVisible}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 2, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.12 }}
            className={`absolute z-50 w-56 sm:w-64 max-w-[calc(100vw-2rem)] p-2.5 top-full mt-1.5 bg-[#0B1220] border border-[#1E293B] rounded-[8px] shadow-2xl shadow-black/60 pointer-events-auto ${alignmentClass}`}
            role="tooltip"
          >
            {/* Arrow */}
            <div className={`absolute -top-1 w-2 h-2 bg-[#0B1220] border-l border-t border-[#1E293B] rotate-45 ${arrowClass}`} />
            
            <p className="text-xs text-[#CBD5E1] leading-relaxed relative z-10">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

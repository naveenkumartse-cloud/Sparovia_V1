'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoTooltipProps {
  content: string;
  align?: 'left' | 'right' | 'center';
}

export function InfoTooltip({ content, align = 'left' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right' | 'center'>(align);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      ? 'left-1.5' 
      : effectiveAlign === 'center' 
        ? 'left-1/2 -translate-x-1/2' 
        : 'right-1.5';

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex items-center text-left shrink-0"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button 
        type="button" 
        onClick={() => setIsVisible(!isVisible)}
        onFocus={() => setIsVisible(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsVisible(false);
          }
        }}
        className="text-[#64748B] hover:text-[#94A3B8] focus:text-[#3B82F6] focus:outline-none rounded-full p-0.5 transition-colors"
        aria-label="Field information"
        aria-expanded={isVisible}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-50 w-56 sm:w-64 max-w-[calc(100vw-3rem)] p-2.5 top-full mt-1.5 bg-[#0B1220] border border-[#1E293B] rounded-xl shadow-2xl shadow-black/60 pointer-events-auto ${alignmentClass}`}
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

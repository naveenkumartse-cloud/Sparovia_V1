'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists; if not, we use clsx/tailwind-merge directly

interface InfoIconProps {
  content: string;
  className?: string;
  id?: string;
}

export function InfoIcon({ content, className, id }: InfoIconProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className={cn("relative inline-flex items-center", className)}
      ref={containerRef}
    >
      <button
        type="button"
        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(!isVisible);
        }}
        aria-label="Information"
        aria-describedby={id}
      >
        <Info className="h-4 w-4" />
      </button>

      {isVisible && (
        <div 
          id={id}
          role="tooltip"
          className="absolute z-10 w-48 sm:w-64 p-2 mt-2 -left-2 top-full text-xs text-white bg-gray-900 rounded-md shadow-lg"
        >
          {content}
        </div>
      )}
    </div>
  );
}

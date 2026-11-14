'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { templateConfig } from '@/config/templateConfig';
import { useWebsiteContent } from '@/components/providers/WebsiteContentProvider';
import { Button } from '@/components/ui/Button';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { website } = useWebsiteContent();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = website?.name || 'KVN Interior';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-out ${
        scrolled
          ? 'py-2.5 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(16,43,80,0.08)] border-b border-gray-100'
          : 'py-4 bg-white/90 backdrop-blur-sm border-b border-gray-100/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative z-20">

        {/* Brand Logo — Official KVN Interior Logo */}
        <a
          href="#hero"
          className="flex items-center gap-3 group focus-ring rounded-lg py-0.5"
          aria-label={`${displayName} — return to top`}
          onClick={closeMobileMenu}
        >
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-md overflow-hidden bg-white border border-[#E8DCC4] shadow-xs">
            <Image
              src="/images/Logo.jpeg"
              alt="KVN Interior Logo"
              width={48}
              height={48}
              priority
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-sans text-base sm:text-lg font-black tracking-wider text-[#102B50]">
                KVN
              </span>
              <span className="font-sans text-base sm:text-lg font-bold tracking-wider text-[#C6A052]">
                INTERIOR
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.16em] uppercase text-charcoal-600 mt-0.5 hidden xs:block">
              uPVC Windows • Doors • Interiors
            </span>
          </div>
        </a>

        {/* Desktop Navigation — Minimal Links */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary Navigation">
          {templateConfig.navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.15em] font-bold py-1 transition-colors duration-200 relative focus-ring rounded
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gold-400 hover:after:w-full after:transition-all after:duration-300
                text-charcoal-700 hover:text-brand-600"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Primary CTA */}
        <div className="hidden lg:block">
          <Button href="#contact" variant="primary" size="sm" icon>
            Get a Quote
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 -mr-2 text-charcoal-900 hover:text-brand-600 focus-ring rounded-lg transition-colors relative z-20"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-brand-600" /> : <Menu className="w-6 h-6 text-brand-600" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="lg:hidden fixed top-0 left-0 right-0 h-[100dvh] z-10 bg-white/98 backdrop-blur-md flex flex-col pt-[72px] overscroll-contain"
        >
          <nav className="flex flex-col px-6 pt-6 pb-6 gap-1 flex-1 overflow-y-auto" aria-label="Mobile Navigation">
            {templateConfig.navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-sm font-bold uppercase tracking-[0.1em] text-charcoal-800 hover:text-brand-600 py-3.5 border-b border-gray-100 focus-ring rounded transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-6">
              <Button
                href="#contact"
                variant="primary"
                size="md"
                icon
                className="w-full text-center"
                onClick={closeMobileMenu}
              >
                Get a Quote
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

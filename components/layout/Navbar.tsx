'use client';

import { useState, useEffect, useCallback } from 'react';
import { siteConfig } from '@/config/siteConfig';
import { Button } from '@/components/ui/Button';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-out ${
        scrolled
          ? 'py-3 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.06)]'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative z-20">

        {/* Brand Logo — KVN Badge + Interiors */}
        <a
          href="#hero"
          className="flex items-center gap-2.5 group focus-ring rounded-lg py-1"
          aria-label="KVN Interiors — return to top"
          onClick={closeMobileMenu}
        >
          <div
            className={`px-2.5 h-8 rounded-lg flex items-center justify-center font-sans font-extrabold text-xs tracking-wider transition-all duration-500 ${
              scrolled
                ? 'bg-brand-600 text-white shadow-purple-glow'
                : 'bg-brand-600 text-white'
            }`}
          >
            KVN
          </div>
          <span className={`font-sans text-[15px] font-bold tracking-[0.12em] uppercase transition-colors duration-500 ${
            scrolled ? 'text-charcoal-900' : 'text-charcoal-900'
          }`}>
            Interiors
          </span>
        </a>

        {/* Desktop Navigation — Minimal Links */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary Navigation">
          {siteConfig.navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-[11px] uppercase tracking-[0.15em] font-semibold py-1 transition-colors duration-300 relative focus-ring rounded
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-brand-600 hover:after:w-full after:transition-all after:duration-300
                ${scrolled ? 'text-charcoal-700 hover:text-brand-600' : 'text-charcoal-700 hover:text-brand-600'}
              `}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Primary CTA */}
        <div className="hidden lg:block">
          <Button href="#contact" variant="primary" size="sm" icon>
            {siteConfig.cta.primary}
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-3 -mr-3 text-charcoal-900 hover:text-brand-600 focus-ring rounded-lg transition-colors relative z-20"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            {siteConfig.navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-sm font-semibold uppercase tracking-[0.1em] text-charcoal-800 hover:text-brand-600 py-4 border-b border-gray-100 focus-ring rounded transition-colors"
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
                {siteConfig.cta.primary}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

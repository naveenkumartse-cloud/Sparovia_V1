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
          ? 'py-2.5 bg-[#080C14]/92 backdrop-blur-md shadow-2xl border-b border-[#CE9E34]/25'
          : 'py-3.5 sm:py-4 bg-[#080C14]/60 backdrop-blur-sm border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative z-20">

        {/* Complete Original KVN Interior Client Logo */}
        <a
          href="#hero"
          className="flex items-center group focus-ring rounded-lg py-0.5 transition-transform duration-200 hover:scale-[1.02]"
          aria-label={`${displayName} — return to top`}
          onClick={closeMobileMenu}
        >
          <div className="relative h-12 sm:h-14 md:h-16 w-auto aspect-[719/584] shrink-0 flex items-center justify-center bg-white/95 rounded-lg p-1.5 border border-[#CE9E34]/40 shadow-md">
            <Image
              src="/images/logo.png"
              alt="KVN Interior — uPVC Windows, Doors & Home Interior"
              width={180}
              height={146}
              priority
              className="h-full w-auto object-contain"
            />
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary Navigation">
          {templateConfig.navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold py-1 transition-colors duration-200 relative focus-ring rounded
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#CE9E34] hover:after:w-full after:transition-all after:duration-300
                text-gray-300 hover:text-[#DFB95C]"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Primary CTA */}
        <div className="hidden lg:block">
          <Button
            href="#contact"
            variant="primary"
            size="sm"
            icon
            className="bg-[#0044A7] hover:bg-[#00388A] text-white border border-[#CE9E34] shadow-[0_0_12px_rgba(206,158,52,0.3)]"
          >
            Get a Quote
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 -mr-2 text-white hover:text-[#CE9E34] focus-ring rounded-lg transition-colors relative z-20 cursor-pointer"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#CE9E34]" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="lg:hidden fixed top-0 left-0 right-0 h-[100dvh] z-10 bg-[#080C14]/98 backdrop-blur-2xl flex flex-col pt-[84px] overscroll-contain"
        >
          <nav className="flex flex-col px-6 pt-6 pb-6 gap-2 flex-1 overflow-y-auto" aria-label="Mobile Navigation">
            {templateConfig.navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-base font-mono font-bold uppercase tracking-[0.15em] text-white hover:text-[#CE9E34] py-4 border-b border-white/10 focus-ring rounded transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-8">
              <Button
                href="#contact"
                variant="primary"
                size="md"
                icon
                className="w-full text-center bg-[#0044A7] hover:bg-[#00388A] text-white border border-[#CE9E34]"
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

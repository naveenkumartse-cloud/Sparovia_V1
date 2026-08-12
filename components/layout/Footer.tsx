'use client';

import { siteConfig } from '@/config/siteConfig';
import { ChevronUp, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasContactInfo = Boolean(
    siteConfig.contact.address ||
    siteConfig.contact.phone ||
    siteConfig.contact.email
  );

  return (
    <footer className="bg-charcoal-900 text-white pt-16 pb-10 relative border-t border-charcoal-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 ${hasContactInfo ? 'md:grid-cols-12' : 'md:grid-cols-2'} gap-10 mb-12`}>
          
          {/* Brand Info */}
          <div className={hasContactInfo ? 'md:col-span-5 space-y-4' : 'space-y-4'}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-sans font-bold text-white text-base shadow-purple-glow">
                S
              </div>
              <span className="font-sans text-xl font-bold tracking-wider uppercase text-white">
                Sparovia
              </span>
            </div>

            <p className="text-xs text-gray-400 font-normal leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>
          </div>

          {/* Navigation Links */}
          <div className={hasContactInfo ? 'md:col-span-3 space-y-3' : 'space-y-3'}>
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-brand-300">
              Navigation
            </h4>
            <nav aria-label="Footer Navigation">
              <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                {siteConfig.navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-white transition-colors focus-ring rounded">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact Information (Only rendered if configured) */}
          {hasContactInfo && (
            <div className="md:col-span-4 space-y-3">
              <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-brand-300">
                Contact Information
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-400 font-normal">
                {siteConfig.contact.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <span>{siteConfig.contact.address}</span>
                  </li>
                )}
                {siteConfig.contact.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                    <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-white focus-ring rounded">
                      {siteConfig.contact.phone}
                    </a>
                  </li>
                )}
                {siteConfig.contact.email && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                    <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white focus-ring rounded">
                      {siteConfig.contact.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-charcoal-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 font-normal">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-brand-300 hover:text-white transition-colors focus-ring rounded cursor-pointer"
            aria-label="Scroll back to top of page"
          >
            <span>Back to Top</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}

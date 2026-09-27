'use client';

import { templateConfig } from '@/config/templateConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { ChevronUp } from 'lucide-react';

export default function Footer() {
  const { footer, website } = useTemplateContent();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = website?.name || 'Sparovia';
  const nameParts = displayName.split(' ');
  const logoBadge = nameParts[0] || 'SPAROVIA';
  const logoRest = nameParts.slice(1).join(' ');

  const copyrightText = footer.copyrightText || `© ${new Date().getFullYear()} ${displayName}. All rights reserved.`;

  return (
    <footer className="bg-charcoal-900 text-white pt-16 pb-10 relative border-t border-charcoal-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-2.5 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-sans font-extrabold text-white text-xs tracking-wider shadow-purple-glow">
                {logoBadge}
              </div>
              {logoRest && (
                <span className="font-sans text-xl font-bold tracking-wider uppercase text-white">
                  {logoRest}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 font-normal leading-relaxed max-w-sm">
              {footer.shortDescription || 'Transforming spaces with custom modular interiors and architectural systems.'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3 md:text-right">
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-brand-300">
              Navigation
            </h4>
            <nav aria-label="Footer Navigation">
              <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                {templateConfig.navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-white transition-colors focus-ring rounded">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-charcoal-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 font-normal">
          <p>{copyrightText}</p>
          
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

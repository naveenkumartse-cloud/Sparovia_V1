'use client';

import { templateConfig } from '@/config/templateConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { ChevronUp, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const { footer, website, social } = useTemplateContent();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = website?.name || 'Sparovia';
  const nameParts = displayName.split(' ');
  const logoBadge = nameParts[0] || 'SPAROVIA';
  const logoRest = nameParts.slice(1).join(' ');

  const copyrightText = footer.copyrightText || `© ${new Date().getFullYear()} ${displayName}. All rights reserved.`;

  const hasFacebook = Boolean(social?.facebookEnabled && social?.facebookUrl);
  const hasInstagram = Boolean(social?.instagramEnabled && social?.instagramUrl);

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

            {(hasFacebook || hasInstagram) && (
              <div className="flex items-center gap-3 pt-2">
                {hasFacebook && (
                  <a
                    href={social!.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center text-white shadow-md transition-all cursor-pointer hover:scale-105"
                    aria-label="Visit our Facebook page"
                  >
                    <Facebook className="w-4.5 h-4.5 text-white" />
                  </a>
                )}
                {hasInstagram && (
                  <a
                    href={social!.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 flex items-center justify-center text-white shadow-md transition-all cursor-pointer hover:scale-105"
                    aria-label="Visit our Instagram profile"
                  >
                    <Instagram className="w-4.5 h-4.5 text-white" />
                  </a>
                )}
              </div>
            )}
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

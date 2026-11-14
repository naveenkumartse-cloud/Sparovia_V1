'use client';

import Image from 'next/image';
import { templateConfig } from '@/config/templateConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { ChevronUp, Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const { footer, website, social, contact } = useTemplateContent();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = website?.name || 'KVN Interior';
  const copyrightText = footer.copyrightText || `© ${new Date().getFullYear()} ${displayName}. All rights reserved.`;

  const hasFacebook = Boolean(social?.facebookEnabled && social?.facebookUrl);
  const hasInstagram = Boolean(social?.instagramEnabled && social?.instagramUrl);

  const phone = contact?.phone || '+91 98765 43210';
  const email = contact?.email || 'contact@kvninterior.com';
  const address = contact?.address || 'Bengaluru, Karnataka, India';

  return (
    <footer className="bg-[#0A192F] text-white pt-16 pb-10 relative border-t border-[#132A4A]" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          
          {/* Brand Info & Complete Official Logo */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-lg overflow-hidden bg-white p-1 border border-[#CE9E34]/30 shadow-md">
              <Image
                src="/images/logo.png"
                alt="KVN Interior — uPVC Windows, Doors & Home Interior"
                width={72}
                height={72}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-gray-300 font-normal leading-relaxed max-w-sm pt-1">
              {footer.shortDescription || 'Crafting bespoke residential interiors, modular casework, and architectural uPVC window and door systems with precision craftsmanship.'}
            </p>

            {/* Quick Contact Line */}
            <div className="space-y-2 pt-2 text-xs text-gray-300">
              {phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#CE9E34] shrink-0" />
                  <span>{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-[#CE9E34] shrink-0" />
                  <span>{email}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[#CE9E34] shrink-0" />
                  <span>{address}</span>
                </div>
              )}
            </div>

            {(hasFacebook || hasInstagram) && (
              <div className="flex items-center gap-3 pt-3">
                {hasFacebook && (
                  <a
                    href={social!.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center text-white shadow-md transition-all cursor-pointer hover:scale-105"
                    aria-label="Visit our Facebook page"
                  >
                    <Facebook className="w-4 h-4 text-white" />
                  </a>
                )}
                {hasInstagram && (
                  <a
                    href={social!.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 flex items-center justify-center text-white shadow-md transition-all cursor-pointer hover:scale-105"
                    aria-label="Visit our Instagram profile"
                  >
                    <Instagram className="w-4 h-4 text-white" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-[#CE9E34]">
              Services &amp; Solutions
            </h4>
            <ul className="space-y-2 text-xs text-gray-300 font-medium">
              <li>
                <a href="#interiors" className="hover:text-[#CE9E34] transition-colors">
                  Modular Kitchens
                </a>
              </li>
              <li>
                <a href="#interiors" className="hover:text-[#CE9E34] transition-colors">
                  Bespoke Wardrobes
                </a>
              </li>
              <li>
                <a href="#interiors" className="hover:text-[#CE9E34] transition-colors">
                  Living &amp; TV Units
                </a>
              </li>
              <li>
                <a href="#upvc" className="hover:text-[#CE9E34] transition-colors">
                  uPVC Windows &amp; Doors
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#CE9E34] transition-colors">
                  Completed Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-4 space-y-3 md:text-right">
            <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-[#CE9E34]">
              Navigation
            </h4>
            <nav aria-label="Footer Navigation">
              <ul className="space-y-2 text-xs text-gray-300 font-medium">
                {templateConfig.navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-[#CE9E34] transition-colors focus-ring rounded">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#132A4A] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 font-normal">
          <p>{copyrightText}</p>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-[#CE9E34] hover:text-white transition-colors focus-ring rounded cursor-pointer"
            aria-label={templateConfig.ui.scrollToTopAriaLabel}
          >
            <span>Back to top</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}

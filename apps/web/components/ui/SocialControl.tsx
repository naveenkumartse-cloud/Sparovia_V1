'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Facebook, X, MessageCircle, ExternalLink } from 'lucide-react';
import { siteConfig } from '@/config/siteConfig';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { recordContactActivity } from '@/lib/analytics/contactTracking';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export function SocialControl() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const templateContent = useTemplateContent();
  const whatsappConfig = templateContent?.whatsapp;
  const socialConfig = templateContent?.social;

  // Compute clean phone number
  let cleanPhone = '';
  if (whatsappConfig?.enabled && whatsappConfig.phoneNumber) {
    const raw = whatsappConfig.phoneNumber.replace(/\D/g, '');
    if (raw.length === 10) {
      cleanPhone = `91${raw}`;
    } else if (raw.length > 10) {
      cleanPhone = raw;
    }
  }

  // Active client-authored WhatsApp templates
  const activeTemplates = (whatsappConfig?.templates || []).filter(t => t.isActive);

  // Default WhatsApp URL fallback
  const defaultText = whatsappConfig?.prefilledMessage ? encodeURIComponent(whatsappConfig.prefilledMessage) : '';
  const defaultWhatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}${defaultText ? `?text=${defaultText}` : ''}` : '';

  // Social Links
  const facebookUrl = (socialConfig?.facebookEnabled && socialConfig.facebookUrl) 
    ? socialConfig.facebookUrl 
    : (siteConfig?.social?.facebook && siteConfig.social.facebook !== '#' ? siteConfig.social.facebook : '');

  const instagramUrl = (socialConfig?.instagramEnabled && socialConfig.instagramUrl) 
    ? socialConfig.instagramUrl 
    : (siteConfig?.social?.instagram && siteConfig.social.instagram !== '#' ? siteConfig.social.instagram : '');

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const hasWhatsApp = Boolean(cleanPhone);
  const hasTemplates = hasWhatsApp && activeTemplates.length > 0;
  const hasFacebook = Boolean(facebookUrl);
  const hasInstagram = Boolean(instagramUrl);

  // If nothing is enabled, render nothing
  if (!hasWhatsApp && !hasFacebook && !hasInstagram) return null;

  // Handle template selection
  const handleTemplateClick = (t: { id: string; title: string; messageText: string }) => {
    recordContactActivity({
      channel: 'WhatsApp',
      templateId: t.id,
      templateTitle: t.title,
      source: 'SocialControl',
    });
    const encoded = encodeURIComponent(t.messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleDefaultWhatsAppClick = () => {
    recordContactActivity({
      channel: 'WhatsApp',
      templateTitle: 'Direct Chat',
      source: 'SocialControl',
    });
    window.open(defaultWhatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSocialClick = (channel: 'Facebook' | 'Instagram', url: string) => {
    recordContactActivity({
      channel,
      source: 'SocialControl',
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // If only a single direct WhatsApp exists without templates or social links:
  const isDirectSingleWhatsApp = hasWhatsApp && !hasTemplates && !hasFacebook && !hasInstagram;

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)]"
      onPointerEnter={(e) => { if (!isDirectSingleWhatsApp && e.pointerType === 'mouse') setIsOpen(true); }}
      onPointerLeave={(e) => { if (!isDirectSingleWhatsApp && e.pointerType === 'mouse') setIsOpen(false); }}
    >
      {isDirectSingleWhatsApp ? (
        <a
          href={defaultWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            recordContactActivity({
              channel: 'WhatsApp',
              templateTitle: 'Direct Chat',
              source: 'SocialControl',
            });
          }}
          className="w-14 h-14 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[#25D366]/40 focus-ring touch-manipulation"
          aria-label="Chat with us on WhatsApp"
        >
          <WhatsAppIcon className="w-7 h-7" />
        </a>
      ) : (
        <>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-3 mb-2 items-end"
              >
                {/* Popover Card for WhatsApp Template Choices */}
                {hasWhatsApp && (
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5 max-w-xs w-64 text-left">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-charcoal-900">
                        Chat on WhatsApp
                      </span>
                    </div>

                    {hasTemplates ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-gray-500 mb-1">
                          Select a conversation topic:
                        </p>
                        {activeTemplates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTemplateClick(t)}
                            className="w-full text-left px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-900 border border-transparent hover:border-emerald-200 transition-all text-xs font-semibold text-charcoal-800 flex items-center justify-between group"
                          >
                            <span className="truncate">{t.title}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 shrink-0 ml-1.5" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDefaultWhatsAppClick}
                        className="w-full text-left px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-900 border border-transparent hover:border-emerald-200 transition-all text-xs font-semibold text-charcoal-800 flex items-center justify-between"
                      >
                        <span>Start Conversation</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </button>
                    )}
                  </div>
                )}

                {/* Social Outbound Icons */}
                {(hasFacebook || hasInstagram) && (
                  <div className="flex items-center gap-2.5">
                    {hasInstagram && (
                      <button
                        type="button"
                        onClick={() => handleSocialClick('Instagram', instagramUrl)}
                        className="w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-pink-600 hover:scale-110 hover:shadow-pink-500/20 transition-all duration-300 focus-ring"
                        aria-label="Visit Instagram Profile"
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                    )}

                    {hasFacebook && (
                      <button
                        type="button"
                        onClick={() => handleSocialClick('Facebook', facebookUrl)}
                        className="w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-blue-600 hover:scale-110 hover:shadow-blue-500/20 transition-all duration-300 focus-ring"
                        aria-label="Visit Facebook Page"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 focus-ring ${
              isOpen 
                ? 'bg-charcoal-900 text-white rotate-90 scale-95' 
                : 'bg-[#25D366] text-white hover:scale-105 hover:shadow-[#25D366]/30'
            }`}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close communication options" : "Open communication options"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <WhatsAppIcon className="w-7 h-7" />}
          </button>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Facebook, X, ExternalLink } from 'lucide-react';
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

  // Active client-authored WhatsApp templates sorted by displayOrder
  const activeTemplates = (whatsappConfig?.templates || [])
    .filter(t => t && t.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Determine channel availability strictly from Admin configuration (no fallbacks to hardcoded values)
  const hasWhatsApp = Boolean(whatsappConfig?.enabled && cleanPhone);
  const hasMultipleTemplates = hasWhatsApp && activeTemplates.length > 1;

  const facebookUrl = (socialConfig?.facebookEnabled && socialConfig?.facebookUrl && socialConfig.facebookUrl.trim().length > 0)
    ? socialConfig.facebookUrl.trim()
    : '';
  const hasFacebook = Boolean(facebookUrl);

  const instagramUrl = (socialConfig?.instagramEnabled && socialConfig?.instagramUrl && socialConfig.instagramUrl.trim().length > 0)
    ? socialConfig.instagramUrl.trim()
    : '';
  const hasInstagram = Boolean(instagramUrl);

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

  // Close on Escape key
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

  // If all channels are disabled in Admin, render nothing
  if (!hasWhatsApp && !hasFacebook && !hasInstagram) {
    return null;
  }

  // Handle template selection
  const handleTemplateClick = (t: { id: string; title: string; messageText: string }) => {
    recordContactActivity({
      channel: 'WhatsApp',
      templateId: t.id,
      templateTitle: t.title,
      source: 'SocialControl',
    });
    setIsOpen(false);
    const encoded = encodeURIComponent(t.messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  // Handle direct WhatsApp click (when only 1 template or no custom templates exist)
  const handleDirectWhatsAppClick = () => {
    if (activeTemplates.length === 1) {
      const single = activeTemplates[0];
      recordContactActivity({
        channel: 'WhatsApp',
        templateId: single.id,
        templateTitle: single.title,
        source: 'SocialControl',
      });
      const encoded = encodeURIComponent(single.messageText);
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    } else {
      recordContactActivity({
        channel: 'WhatsApp',
        templateTitle: 'Direct Chat',
        source: 'SocialControl',
      });
      const defaultText = whatsappConfig?.prefilledMessage ? encodeURIComponent(whatsappConfig.prefilledMessage) : '';
      const url = `https://wa.me/${cleanPhone}${defaultText ? `?text=${defaultText}` : ''}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsAppButtonClick = () => {
    if (hasMultipleTemplates) {
      setIsOpen(prev => !prev);
    } else {
      handleDirectWhatsAppClick();
    }
  };

  const handleSocialClick = (channel: 'Facebook' | 'Instagram', url: string) => {
    recordContactActivity({
      channel,
      source: 'SocialControl',
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)] pointer-events-auto"
    >
      {/* WhatsApp Template Selector Popover */}
      <AnimatePresence>
        {isOpen && hasMultipleTemplates && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-modal="false"
            aria-label="WhatsApp conversation choices"
            className="mb-1 w-72 sm:w-80 max-w-[calc(100vw-3rem)] rounded-[8px] bg-white dark:bg-[#0F172A] p-3.5 shadow-2xl border border-slate-200 dark:border-[#1E293B] text-left"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#172033] dark:text-white">
                  Chat on WhatsApp
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
                aria-label="Close WhatsApp choices"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Instruction */}
            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mb-2 leading-relaxed">
              Select an enquiry topic to start your WhatsApp chat:
            </p>

            {/* Template Choices */}
            <div className="space-y-1.5" role="menu">
              {activeTemplates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleTemplateClick(t)}
                  className="w-full text-left p-2.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1E293B]/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#172033] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                      {t.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                  </div>
                  {t.messageText && (
                    <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] line-clamp-1 mt-0.5 font-normal">
                      {t.messageText}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Micro disclaimer */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 text-center">
              Opens WhatsApp with prefilled message to review and send.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons Group */}
      <div className="flex items-center gap-2">
        {/* Instagram Icon (Only if enabled) */}
        {hasInstagram && (
          <button
            type="button"
            onClick={() => handleSocialClick('Instagram', instagramUrl)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-[#0F172A] shadow-lg border border-slate-200 dark:border-[#1E293B] flex items-center justify-center text-[#E1306C] hover:scale-105 active:scale-95 transition-all duration-200 focus-ring"
            aria-label="Visit our Instagram profile"
            title="Visit our Instagram profile"
          >
            <Instagram className="w-5 h-5" />
          </button>
        )}

        {/* Facebook Icon (Only if enabled) */}
        {hasFacebook && (
          <button
            type="button"
            onClick={() => handleSocialClick('Facebook', facebookUrl)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-[#0F172A] shadow-lg border border-slate-200 dark:border-[#1E293B] flex items-center justify-center text-[#1877F2] hover:scale-105 active:scale-95 transition-all duration-200 focus-ring"
            aria-label="Visit our Facebook page"
            title="Visit our Facebook page"
          >
            <Facebook className="w-5 h-5" />
          </button>
        )}

        {/* WhatsApp Icon (Only if enabled) */}
        {hasWhatsApp && (
          <button
            type="button"
            onClick={handleWhatsAppButtonClick}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-ring ${
              isOpen
                ? 'bg-charcoal-900 text-white'
                : 'bg-[#25D366] hover:bg-[#20ba59] text-white hover:shadow-[#25D366]/30'
            }`}
            aria-label={
              hasMultipleTemplates
                ? isOpen
                  ? 'Close WhatsApp choices'
                  : 'Open WhatsApp conversation choices'
                : 'Chat with us on WhatsApp'
            }
            aria-haspopup={hasMultipleTemplates ? 'dialog' : undefined}
            aria-expanded={hasMultipleTemplates ? isOpen : undefined}
            title="Chat with us on WhatsApp"
          >
            {isOpen ? <X className="w-6 h-6" /> : <WhatsAppIcon className="w-7 h-7" />}
          </button>
        )}
      </div>
    </div>
  );
}

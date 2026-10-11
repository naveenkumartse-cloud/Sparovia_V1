'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Instagram, 
  Facebook, 
  X, 
  ExternalLink, 
  MessageCircle, 
  MessageSquareMore,
  ChevronRight, 
  ArrowLeft 
} from 'lucide-react';
import { useTemplateContent, WhatsAppTemplate } from '@/components/providers/WebsiteContentProvider';

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

/**
 * Composes a clean, independent WhatsApp prefilled message string incorporating category context
 * without duplicating category mentions or greeting prefixes.
 */
export function composeWhatsAppMessage(messageText: string, category?: string): string {
  const trimmedMsg = (messageText || '').trim();
  const trimmedCat = (category || '').trim();
  if (!trimmedCat) return trimmedMsg;
  if (!trimmedMsg) return `Hi, regarding ${trimmedCat}.`;

  if (trimmedMsg.toLowerCase().includes(trimmedCat.toLowerCase())) {
    return trimmedMsg;
  }

  const greetingMatch = trimmedMsg.match(/^(hi|hello|hey)[,.]?\s*/i);
  if (greetingMatch) {
    const greeting = greetingMatch[1];
    const rest = trimmedMsg.slice(greetingMatch[0].length);
    const capGreeting = greeting.charAt(0).toUpperCase() + greeting.slice(1).toLowerCase();
    return `${capGreeting}, regarding ${trimmedCat} — ${rest}`;
  }

  return `Regarding ${trimmedCat}: ${trimmedMsg}`;
}

export function SocialControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelView, setPanelView] = useState<'channels' | 'whatsapp-templates'>('channels');
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const templateContent = useTemplateContent();
  const whatsappConfig = templateContent?.whatsapp;
  const socialConfig = templateContent?.social;

  // Compute clean phone number for wa.me links
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
  const activeTemplates: WhatsAppTemplate[] = (whatsappConfig?.templates || [])
    .filter(t => t && t.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Channel availability strictly from verified Admin configuration
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

  // If only WhatsApp is active with multiple templates, default panelView directly to templates
  const onlyWhatsAppWithTemplates = hasWhatsApp && !hasFacebook && !hasInstagram && hasMultipleTemplates;

  // Clear hover-leave timer
  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  // Open with hover or focus
  const handleMouseEnter = () => {
    clearCloseTimer();
    if (!isOpen) {
      setPanelView(onlyWhatsAppWithTemplates ? 'whatsapp-templates' : 'channels');
      setIsOpen(true);
    }
  };

  // Delayed close on hover exit so cursor can safely transition between button and panel
  const handleMouseLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setPanelView('channels');
    }, 280);
  };

  // Close completely on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setPanelView('channels');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearCloseTimer();
    };
  }, []);

  // Close or go back on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        if (panelView === 'whatsapp-templates' && !onlyWhatsAppWithTemplates) {
          setPanelView('channels');
        } else {
          setIsOpen(false);
          setPanelView('channels');
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, panelView, onlyWhatsAppWithTemplates]);

  // If all channels are disabled in Admin, render nothing
  if (!hasWhatsApp && !hasFacebook && !hasInstagram) {
    return null;
  }

  // Handle WhatsApp template click
  const handleTemplateClick = (t: WhatsAppTemplate) => {
    setIsOpen(false);
    setPanelView('channels');
    const composed = composeWhatsAppMessage(t.messageText, t.category);
    const encoded = encodeURIComponent(composed);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  // Direct WhatsApp click when single or no templates exist
  const handleDirectWhatsAppClick = () => {
    if (activeTemplates.length === 1) {
      const single = activeTemplates[0];
      setIsOpen(false);
      setPanelView('channels');
      const composed = composeWhatsAppMessage(single.messageText, single.category);
      const encoded = encodeURIComponent(composed);
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    } else {
      setIsOpen(false);
      setPanelView('channels');
      const defaultText = whatsappConfig?.prefilledMessage ? encodeURIComponent(whatsappConfig.prefilledMessage) : '';
      const url = `https://wa.me/${cleanPhone}${defaultText ? `?text=${defaultText}` : ''}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle click on the WhatsApp row in the channels menu
  const handleWhatsAppChannelSelect = () => {
    if (hasMultipleTemplates) {
      setPanelView('whatsapp-templates');
    } else {
      handleDirectWhatsAppClick();
    }
  };

  // Handle external social profile navigation
  const handleSocialClick = (channel: 'Facebook' | 'Instagram', url: string) => {
    setIsOpen(false);
    setPanelView('channels');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Toggle button click (primarily for touch devices)
  const handleLauncherClick = () => {
    clearCloseTimer();
    if (isOpen) {
      setIsOpen(false);
      setPanelView('channels');
    } else {
      setPanelView(onlyWhatsAppWithTemplates ? 'whatsapp-templates' : 'channels');
      setIsOpen(true);
    }
  };

  // Total enabled channels count
  const enabledCount = (hasWhatsApp ? 1 : 0) + (hasFacebook ? 1 : 0) + (hasInstagram ? 1 : 0);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)] pointer-events-auto"
    >
      {/* Expandable Unified Contact & Social Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: shouldReduceMotion ? 0.05 : 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-modal="false"
            aria-label="Contact and Social channels"
            className="mb-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md p-4 shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left overflow-hidden"
          >
            {/* VIEW 1: All Enabled Channels */}
            {panelView === 'channels' && (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center shrink-0">
                      <MessageSquareMore className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#172033] dark:text-white block leading-tight">
                        Get in Touch
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                        {enabledCount} contact channel{enabledCount > 1 ? 's' : ''} available
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-[6px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close contact options"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Vertical Channel Options */}
                <div className="space-y-2" role="menu">
                  {/* WhatsApp Option */}
                  {hasWhatsApp && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleWhatsAppChannelSelect}
                      className="w-full text-left p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-xs group cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <WhatsAppIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172033] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                            WhatsApp
                          </p>
                          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate font-normal">
                            {hasMultipleTemplates
                              ? `${activeTemplates.length} enquiry topics`
                              : activeTemplates.length === 1
                              ? activeTemplates[0].title
                              : 'Chat directly with our team'}
                          </p>
                        </div>
                      </div>
                      {hasMultipleTemplates ? (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  )}

                  {/* Instagram Option */}
                  {hasInstagram && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleSocialClick('Instagram', instagramUrl)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-slate-200/70 dark:border-slate-700/60 hover:border-pink-300 dark:hover:border-pink-600 transition-all text-xs group cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172033] dark:text-white group-hover:text-pink-700 dark:group-hover:text-pink-300 truncate">
                            Instagram
                          </p>
                          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate font-normal">
                            Explore our latest work &amp; reels
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 shrink-0" />
                    </button>
                  )}

                  {/* Facebook Option */}
                  {hasFacebook && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleSocialClick('Facebook', facebookUrl)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-xs group cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172033] dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">
                            Facebook
                          </p>
                          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate font-normal">
                            Official page and updates
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: WhatsApp Template Chooser */}
            {panelView === 'whatsapp-templates' && (
              <div>
                {/* Header with Back button */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {!onlyWhatsAppWithTemplates && (
                      <button
                        type="button"
                        onClick={() => setPanelView('channels')}
                        className="p-1 -ml-1 rounded-[6px] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        aria-label="Back to channels"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Channels</span>
                      </button>
                    )}
                    {onlyWhatsAppWithTemplates && (
                      <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <WhatsAppIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#172033] dark:text-white">
                      WhatsApp Topics
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setPanelView('channels');
                    }}
                    className="p-1 rounded-[6px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close WhatsApp topics"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mb-2 leading-relaxed">
                  Select an enquiry topic to start your WhatsApp chat:
                </p>

                {/* Template Choices */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5" role="menu">
                  {activeTemplates.map(t => {
                    const composedPreview = composeWhatsAppMessage(t.messageText, t.category);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleTemplateClick(t)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-xs group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#172033] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                            {t.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {t.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
                                {t.category}
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                          </div>
                        </div>
                        {composedPreview && (
                          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] line-clamp-1 mt-0.5 font-normal">
                            {composedPreview}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 text-center">
                  Opens WhatsApp with prefilled message to review and send.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Compact Floating Launcher Button */}
      <button
        type="button"
        onClick={handleLauncherClick}
        aria-label={
          isOpen 
            ? 'Close contact options' 
            : 'Open contact options (WhatsApp, Instagram, Facebook)'
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Contact and Social channels"
        className={`group relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus-ring ${
          isOpen
            ? 'bg-[#172033] text-white hover:bg-black dark:bg-[#1E293B] dark:hover:bg-slate-800'
            : 'bg-[#315FEA] hover:bg-[#254EDB] text-white shadow-xl shadow-[#315FEA]/35 ring-4 ring-[#315FEA]/15'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquareMore className="w-6 h-6 text-white" />
            {/* Live presence online indicator */}
            <span className="absolute top-1 right-1 flex h-3 w-3" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366] border-2 border-white dark:border-[#0F172A]" />
            </span>
            {/* Desktop hover pill tooltip */}
            <span className="hidden sm:group-hover:inline-flex opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 absolute right-16 top-1/2 -translate-y-1/2 items-center px-2.5 py-1 rounded-md bg-[#172033]/90 text-white text-[11px] font-medium whitespace-nowrap shadow-md pointer-events-none">
              Chat &amp; Social
            </span>
          </>
        )}
      </button>
    </div>
  );
}

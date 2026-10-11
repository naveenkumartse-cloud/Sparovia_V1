'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { cleanPhoneInput, handlePhoneKeyDown, handlePhonePaste, isValidIndianPhone } from '@/lib/validation/authValidation';
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Monitor, 
  CheckCircle2, 
  Copy, 
  Check, 
  Lock, 
  KeyRound, 
  Sparkles,
  Info,
  Edit3,
  Save,
  Phone,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Facebook,
  Instagram,
  Share2,
  CheckCheck
} from 'lucide-react';

export interface WhatsAppTemplateItem {
  id: string;
  title: string;
  messageText: string;
  displayOrder: number;
  isActive: boolean;
  category?: string;
  categoryId?: string;
  intent?: string;
}

function composeWhatsAppMessage(messageText: string, category?: string): string {
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

interface WhatsAppIntegration {
  enabled: boolean;
  phoneNumber: string;
  prefilledMessage: string;
  status: string;
  templates: WhatsAppTemplateItem[];
}

interface SocialLinksIntegration {
  facebookUrl: string;
  facebookEnabled: boolean;
  instagramUrl: string;
  instagramEnabled: boolean;
}

export default function AccountPage() {
  const { user, checkAuth } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'integrations' | 'security'>(
    activeTabParam === 'settings' ? 'settings' : activeTabParam === 'integrations' ? 'integrations' : activeTabParam === 'security' ? 'security' : 'profile'
  );

  const [copiedTenantId, setCopiedTenantId] = useState(false);

  // Dynamic tenant categories state
  const [tenantCategories, setTenantCategories] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // WhatsApp Integration State
  const [waLoading, setWaLoading] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waEnabled, setWaEnabled] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('Hello! I am exploring interior design and execution services for my property. Could we connect with a design consultant to discuss possibilities?');
  const [waStatus, setWaStatus] = useState('Inactive');
  const [waError, setWaError] = useState<string | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplateItem[]>([
    {
      id: 'template-1',
      title: 'Plan a New Project',
      messageText: 'Hello! I am planning a new interior project and would like to schedule a personalized design consultation to review layout concepts, budget, and timelines.',
      displayOrder: 1,
      isActive: true,
      category: 'Full Home Interior',
      intent: 'New Project',
    },
    {
      id: 'template-2',
      title: 'Modular Kitchen & Wardrobes',
      messageText: 'Hello! I am interested in bespoke modular kitchen and wardrobe solutions. Could you share layout options, material finishes, and consultation availability?',
      displayOrder: 2,
      isActive: true,
      category: 'Modular Kitchen',
      intent: 'Product Consultation',
    },
    {
      id: 'template-3',
      title: 'Request Project Estimate',
      messageText: 'Hello! I have architectural floorplans ready and would like to request a comprehensive project estimate and execution schedule for our space.',
      displayOrder: 3,
      isActive: true,
      category: 'Consultation & Estimate',
      intent: 'Price Estimate',
    },
  ]);

  // Social Links Integration State
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editErrors, setEditErrors] = useState<{ fullName?: string; phoneNumber?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditFullName(user?.fullName || '');
    setEditPhoneNumber(user?.phoneNumber || '');
    setEditErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditFullName(user?.fullName || '');
    setEditPhoneNumber(user?.phoneNumber || '');
    setEditErrors({});
    setIsEditing(false);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: { fullName?: string; phoneNumber?: string } = {};

    if (!editFullName.trim()) {
      errors.fullName = 'Account name is required.';
    } else if (editFullName.trim().length < 2 || editFullName.trim().length > 100) {
      errors.fullName = 'Account name must be between 2 and 100 characters.';
    }

    if (editPhoneNumber.trim()) {
      const digitsOnly = editPhoneNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
        errors.phoneNumber = 'Phone number must be a valid 10-digit Indian phone number.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSaving(true);
    setEditErrors({});

    try {
      await apiClient.put('/auth/me', {
        fullName: editFullName.trim(),
        phoneNumber: editPhoneNumber.trim() ? editPhoneNumber.replace(/\D/g, '') : null,
      });

      toast.success('Account profile updated successfully.');
      setIsEditing(false);
      await checkAuth();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchWhatsAppSettings = async () => {
    setWaLoading(true);
    setWaError(null);
    try {
      const res = await apiClient.get<WhatsAppIntegration>('/integrations/whatsapp');
      setWaEnabled(Boolean(res.enabled));
      setWaPhone(cleanPhoneInput(res.phoneNumber || ''));
      setWaMessage(res.prefilledMessage || 'Hello! I am exploring interior design and execution services for my property. Could we connect with a design consultant to discuss possibilities?');
      setWaStatus(res.status || (res.enabled ? 'Active' : 'Inactive'));
      if (res.templates && Array.isArray(res.templates) && res.templates.length > 0) {
        setWaTemplates(res.templates);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setWaLoading(false);
    }
  };

  const fetchSocialSettings = async () => {
    setSocialLoading(true);
    setSocialError(null);
    try {
      const res = await apiClient.get<SocialLinksIntegration>('/integrations/social');
      setFacebookUrl(res.facebookUrl || '');
      setFacebookEnabled(Boolean(res.facebookEnabled));
      setInstagramUrl(res.instagramUrl || '');
      setInstagramEnabled(Boolean(res.instagramEnabled));
    } catch {
      // Non-blocking fallback
    } finally {
      setSocialLoading(false);
    }
  };

  const fetchTenantCategories = async () => {
    setLoadingCategories(true);
    try {
      const res: any = await apiClient.get('/website/categories');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setTenantCategories(list);
    } catch (err) {
      console.error('Failed to load categories for integrations:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppSettings();
    fetchSocialSettings();
    fetchTenantCategories();
  }, []);

  useEffect(() => {
    if (activeTabParam === 'settings' || activeTabParam === 'integrations' || activeTabParam === 'security' || activeTabParam === 'profile') {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: 'profile' | 'settings' | 'integrations' | 'security') => {
    setActiveTab(tab);
    router.replace(`/admin/account?tab=${tab}`, { scroll: false });
  };

  const TEMPLATE_PRESETS = [
    {
      title: 'Plan a New Project',
      category: 'Full Home Interior',
      messageText: 'Hello! I am planning a new interior project and would like to schedule a personalized design consultation to review layout concepts, budget, and timelines.',
    },
    {
      title: 'Modular Kitchen & Wardrobes',
      category: 'Modular Kitchen',
      messageText: 'Hello! I am interested in bespoke modular kitchen and wardrobe solutions. Could you share layout options, material finishes, and consultation availability?',
    },
    {
      title: 'Request Project Estimate',
      category: 'Consultation & Estimate',
      messageText: 'Hello! I have architectural floorplans ready and would like to request a comprehensive project estimate and execution schedule for our space.',
    },
    {
      title: 'Book Design Consultation',
      category: 'Design Consultation',
      messageText: 'Hello! I would like to schedule an in-depth design consultation with a senior interior architect to discuss our project aspirations.',
    },
  ];

  const handleApplyPreset = (index: number, preset: typeof TEMPLATE_PRESETS[0]) => {
    const updated = [...waTemplates];
    const matchedCategory = tenantCategories.find(
      (c) => c.name.toLowerCase() === preset.category.toLowerCase()
    );
    updated[index] = {
      ...updated[index],
      title: preset.title,
      category: matchedCategory ? matchedCategory.name : preset.category,
      categoryId: matchedCategory ? matchedCategory.id : undefined,
      messageText: preset.messageText,
    };
    setWaTemplates(updated);
    toast.success(`Applied "${preset.title}" preset.`);
  };

  const handleUpdateTemplateCategory = (index: number, categoryName: string) => {
    const updated = [...waTemplates];
    if (!categoryName) {
      updated[index] = { ...updated[index], category: '', categoryId: undefined };
    } else {
      const matched = tenantCategories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      updated[index] = {
        ...updated[index],
        category: categoryName,
        categoryId: matched?.id,
      };
    }
    setWaTemplates(updated);
  };

  const handleAddTemplate = () => {
    if (waTemplates.length >= 4) {
      toast.error('A maximum of 4 WhatsApp templates are supported.');
      return;
    }
    const newTemplate: WhatsAppTemplateItem = {
      id: `template-${Date.now()}`,
      title: `Choice ${waTemplates.length + 1}`,
      messageText: 'Hello, I would like to inquire about your services and discuss requirements.',
      displayOrder: waTemplates.length + 1,
      isActive: true,
      category: 'General Enquiry',
      intent: 'New Enquiry',
    };
    setWaTemplates([...waTemplates, newTemplate]);
  };

  const handleUpdateTemplate = (index: number, field: keyof WhatsAppTemplateItem, value: any) => {
    const updated = [...waTemplates];
    updated[index] = { ...updated[index], [field]: value };
    setWaTemplates(updated);
  };

  const handleDeleteTemplate = (index: number) => {
    if (waTemplates.length <= 1) {
      toast.error('You must keep at least 1 template.');
      return;
    }
    const updated = waTemplates.filter((_, i) => i !== index).map((t, i) => ({ ...t, displayOrder: i + 1 }));
    setWaTemplates(updated);
  };

  const handleMoveTemplate = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= waTemplates.length) return;
    const updated = [...waTemplates];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setWaTemplates(updated.map((t, i) => ({ ...t, displayOrder: i + 1 })));
  };

  const handleSaveWhatsApp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setWaError(null);

    const cleanPhone = cleanPhoneInput(waPhone);
    if (waEnabled && (!cleanPhone || !isValidIndianPhone(cleanPhone))) {
      setWaError('Enter a valid 10-digit mobile number.');
      return;
    }

    if (waTemplates.length === 0) {
      setWaError('At least 1 WhatsApp message template is required (3–4 templates recommended).');
      return;
    }

    if (waTemplates.length > 4) {
      setWaError('A maximum of 4 WhatsApp message templates are supported.');
      return;
    }

    for (let i = 0; i < waTemplates.length; i++) {
      const t = waTemplates[i];
      if (!t.title.trim()) {
        setWaError(`Template #${i + 1} must have a title.`);
        return;
      }
      if (t.title.trim().length > 100) {
        setWaError(`Template #${i + 1} title cannot exceed 100 characters.`);
        return;
      }
      if (t.category && t.category.trim().length > 100) {
        setWaError(`Template #${i + 1} category cannot exceed 100 characters.`);
        return;
      }
      if (!t.messageText.trim()) {
        setWaError(`Template #${i + 1} must have message text.`);
        return;
      }
      if (t.messageText.trim().length > 1000) {
        setWaError(`Template #${i + 1} message cannot exceed 1000 characters.`);
        return;
      }
    }

    if (waEnabled && !waTemplates.some(t => t.isActive)) {
      setWaError('At least one template must be active when WhatsApp integration is enabled.');
      return;
    }

    setWaSaving(true);
    try {
      const res = await apiClient.put<WhatsAppIntegration>('/integrations/whatsapp', {
        enabled: waEnabled,
        phoneNumber: cleanPhone ? `+91${cleanPhone}` : '',
        prefilledMessage: waMessage.trim(),
        templates: waTemplates.map((t, idx) => ({
          ...t,
          displayOrder: idx + 1,
          category: t.category?.trim() || undefined,
          categoryId: t.categoryId?.trim() || undefined,
          intent: t.intent?.trim() || undefined,
        })),
      });
      setWaEnabled(Boolean(res.enabled));
      setWaPhone(cleanPhone);
      setWaMessage(res.prefilledMessage || waMessage);
      setWaStatus(res.status || (res.enabled ? 'Active' : 'Inactive'));
      if (res.templates && Array.isArray(res.templates)) {
        setWaTemplates(res.templates);
      }
      toast.success(res.enabled ? 'WhatsApp button and templates activated on live website.' : 'WhatsApp settings saved.');
    } catch (err: any) {
      setWaError(err.message || 'Failed to save WhatsApp settings.');
      toast.error(err.message || 'Failed to save WhatsApp settings.');
    } finally {
      setWaSaving(false);
    }
  };

  const handleSaveSocial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSocialError(null);

    const validateUrl = (url: string, platform: string) => {
      if (!url.trim()) return null;
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return `${platform} URL must start with http:// or https://. Unsafe schemes are rejected.`;
        }
        return null;
      } catch {
        return `Please enter a valid absolute ${platform} URL (e.g. https://${platform.toLowerCase()}.com/yourhandle).`;
      }
    };

    if (facebookEnabled && !facebookUrl.trim()) {
      setSocialError('Facebook URL is required when Facebook link is enabled.');
      return;
    }
    const fbErr = validateUrl(facebookUrl, 'Facebook');
    if (fbErr) {
      setSocialError(fbErr);
      return;
    }

    if (instagramEnabled && !instagramUrl.trim()) {
      setSocialError('Instagram URL is required when Instagram link is enabled.');
      return;
    }
    const igErr = validateUrl(instagramUrl, 'Instagram');
    if (igErr) {
      setSocialError(igErr);
      return;
    }

    setSocialSaving(true);
    try {
      const res = await apiClient.put<SocialLinksIntegration>('/integrations/social', {
        facebookUrl: facebookUrl.trim(),
        facebookEnabled,
        instagramUrl: instagramUrl.trim(),
        instagramEnabled,
      });
      setFacebookUrl(res.facebookUrl || '');
      setFacebookEnabled(Boolean(res.facebookEnabled));
      setInstagramUrl(res.instagramUrl || '');
      setInstagramEnabled(Boolean(res.instagramEnabled));
      toast.success('Social profile links saved successfully.');
    } catch (err: any) {
      setSocialError(err.message || 'Failed to save social links.');
      toast.error(err.message || 'Failed to save social links.');
    } finally {
      setSocialSaving(false);
    }
  };

  const copyTenantId = () => {
    if (user?.tenantId) {
      navigator.clipboard.writeText(user.tenantId);
      setCopiedTenantId(true);
      toast.success('Workspace ID copied to clipboard.');
      setTimeout(() => setCopiedTenantId(false), 2000);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const label = newTheme === 'system' ? 'System Default' : newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
    toast.info(`Appearance updated to ${label} mode.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Account &amp; Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Manage your client profile, admin appearance preferences, integrations, and workspace security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B] space-x-2 sm:space-x-4">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('integrations')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'integrations'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Integrations</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('security')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#8B3FD1] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {user?.fullName || 'Business Owner'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">
                      {user?.email}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {!isEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartEdit}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#3B82F6]" />}
                    className="text-xs"
                  >
                    Edit Account
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-[#3B82F6] border border-blue-500/20">
                    <Edit3 className="w-3.5 h-3.5" />
                    Editing Mode
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="accountFullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Account Name {isEditing && <span className="text-[#FF7043]">*</span>}
                    </label>
                    <InfoTooltip content="The legal name of the registered workspace administrator." />
                  </div>
                  {isEditing ? (
                    <div className="mt-2 space-y-1">
                      <input
                        id="accountFullName"
                        type="text"
                        autoFocus
                        value={editFullName}
                        maxLength={100}
                        spellCheck={false}
                        autoCapitalize="words"
                        onChange={(e) => {
                          setEditFullName(e.target.value);
                          if (editErrors.fullName) setEditErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                        placeholder="Your full legal name"
                        className={`w-full bg-white dark:bg-[#0B1220] border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all ${
                          editErrors.fullName
                            ? 'border-red-500 dark:border-red-500/80 ring-1 ring-red-500'
                            : 'border-slate-300 dark:border-[#334155]'
                        }`}
                      />
                      {editErrors.fullName && (
                        <p className="text-xs text-red-600 dark:text-red-400">{editErrors.fullName}</p>
                      )}
                    </div>
                  ) : (
                    <input
                      id="accountFullName"
                      type="text"
                      readOnly
                      value={user?.fullName || ''}
                      className="mt-2 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white cursor-default focus:outline-none"
                    />
                  )}
                </div>

                {/* Email Address (Read-only for auth safety) */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="accountEmail" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Work Email (Primary)
                    </label>
                    <InfoTooltip content="Primary authentication email. Protected and verified against your Sparovia workspace." />
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="accountEmail"
                      type="email"
                      readOnly
                      value={user?.email || ''}
                      className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white cursor-default pr-24 focus:outline-none"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-[#64748B] flex items-center">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Phone Number */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="accountPhone" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Contact Phone
                    </label>
                    <InfoTooltip content="Registered mobile number for SMS notifications and direct administrative verification." />
                  </div>
                  {isEditing ? (
                    <div className="mt-2 space-y-1">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          +91
                        </span>
                        <input
                          id="accountPhone"
                          type="tel"
                          inputMode="numeric"
                          value={editPhoneNumber}
                          maxLength={10}
                          spellCheck={false}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setEditPhoneNumber(digits);
                            if (editErrors.phoneNumber) setEditErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                          }}
                          placeholder="9876543210"
                          className={`w-full bg-white dark:bg-[#0B1220] border rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all font-mono ${
                            editErrors.phoneNumber
                              ? 'border-red-500 dark:border-red-500/80 ring-1 ring-red-500'
                              : 'border-slate-300 dark:border-[#334155]'
                          }`}
                        />
                      </div>
                      {editErrors.phoneNumber && (
                        <p className="text-xs text-red-600 dark:text-red-400">{editErrors.phoneNumber}</p>
                      )}
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Enter a valid 10-digit Indian mobile number.
                      </p>
                    </div>
                  ) : (
                    <input
                      id="accountPhone"
                      type="text"
                      readOnly
                      value={user?.phoneNumber ? `+91 ${user.phoneNumber}` : 'Not provided'}
                      className="mt-2 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white cursor-default focus:outline-none"
                    />
                  )}
                </div>

                {/* Workspace Identifier */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="accountTenantId" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Workspace ID
                    </label>
                    <InfoTooltip content="Your isolated tenant boundary identifier across the Sparovia architecture." />
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="accountTenantId"
                      type="text"
                      readOnly
                      value={user?.tenantId || 'Not assigned'}
                      className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-default pr-12 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyTenantId}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-white p-1 rounded transition-colors"
                      title="Copy Workspace ID"
                    >
                      {copiedTenantId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Membership Role */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Account Role
                    </label>
                    <InfoTooltip content="Your authorization privileges within this client workspace." />
                  </div>
                  <div className="mt-2 flex items-center h-[42px] px-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155]">
                    <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-[#3B82F6]" />
                      Workspace Owner
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Mode Actions Footer */}
              {isEditing && (
                <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-end gap-3 animate-in fade-in duration-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    loadingText="Saving Changes..."
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="w-full sm:w-auto px-6"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS (APPEARANCE) */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Sun className="w-5 h-5 mr-2 text-[#FF7043]" />
                Appearance
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
                Customize how the Sparovia Admin workspace looks on your device.
              </p>
            </div>

            {/* Public Website Isolation Notice */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 border border-blue-200/60 dark:border-[#3B82F6]/20 flex items-start space-x-3">
              <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white">Public Website Isolation:</span>{' '}
                This appearance setting strictly applies to your private Sparovia Admin dashboard. It does <strong>NOT</strong> change your Public Website theme or published customer-facing design.
              </div>
            </div>

            {/* Theme Selector Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-blue-900/10 shadow-md ring-2 ring-[#3B82F6]/20'
                    : 'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569] bg-slate-50/50 dark:bg-[#0B1220]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'light' ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-slate-300 dark:border-[#475569]'
                  }`}>
                    {theme === 'light' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Light</p>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Clean, crisp white and neutral slate surfaces with optimal daytime contrast.
                  </p>
                </div>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-blue-900/10 shadow-md ring-2 ring-[#3B82F6]/20'
                    : 'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569] bg-slate-50/50 dark:bg-[#0B1220]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'dark' ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-slate-300 dark:border-[#475569]'
                  }`}>
                    {theme === 'dark' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Dark</p>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Signature Sparovia Dark Navy (#0B1220) and Charcoal surfaces for focused workflow.
                  </p>
                </div>
              </button>

              {/* System Default */}
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                  theme === 'system'
                    ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-blue-900/10 shadow-md ring-2 ring-[#3B82F6]/20'
                    : 'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569] bg-slate-50/50 dark:bg-[#0B1220]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'system' ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-slate-300 dark:border-[#475569]'
                  }`}>
                    {theme === 'system' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">System Default</p>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Automatically match your operating system theme preference (currently: {resolvedTheme}).
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INTEGRATIONS (WHATSAPP & SOCIAL LINKS) */}
      {activeTab === 'integrations' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Panel 1: WhatsApp Configuration & Templates */}
          <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3E7ED] dark:border-[#1E293B]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#172033] dark:text-white flex items-center gap-2">
                    WhatsApp Contact &amp; Templates
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
                      waEnabled
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-[#F3F6FA] text-[#475569] dark:bg-slate-800 dark:text-slate-400 border-[#E3E7ED] dark:border-slate-700'
                    }`}>
                      {waEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
                    Connect your WhatsApp business number and manage 3–4 client-authored templates for website visitors.
                  </p>
                </div>
              </div>

              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone.replace(/\D/g, '')}${waMessage ? `?text=${encodeURIComponent(waMessage)}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
                >
                  <span>Test Default Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <form onSubmit={handleSaveWhatsApp} className="mt-6 space-y-6">
              {waError && (
                <div className="p-3.5 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{waError}</span>
                </div>
              )}

              {/* Toggle Enable/Disable */}
              <div className="p-4 rounded-[6px] bg-[#F3F6FA] dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#334155] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#172033] dark:text-white">
                    Display WhatsApp Contact on Website
                  </p>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
                    When active, visitors can select independent prefilled choices to open WhatsApp directly with your business.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={waEnabled}
                    onChange={(e) => setWaEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  Business WhatsApp Phone Number *
                </label>
                <p className="text-xs text-slate-400 mt-0.5 mb-2">
                  Include 10-digit mobile number (India). Will be formatted as +91 for WhatsApp wa.me links.
                </p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => {
                      setWaPhone(e.target.value);
                      if (waError) setWaError(null);
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] pl-10 pr-4 py-2.5 text-sm text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA] font-mono transition-all"
                  />
                </div>
              </div>

              {/* Default / Fallback Pre-filled Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  Default Greeting Message (Fallback)
                </label>
                <p className="text-xs text-slate-400 mt-0.5 mb-2">
                  Used if direct chat icon is clicked without choosing a specific template.
                </p>
                <textarea
                  rows={2}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="Hello! I am exploring interior design and execution services for my property. Could we connect with a design consultant to discuss possibilities?"
                  className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-4 py-2 text-sm text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA] transition-all resize-none"
                />
              </div>

              {/* Client-authored WhatsApp Templates Section */}
              <div className="pt-6 border-t border-[#E3E7ED] dark:border-[#1E293B] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#172033] dark:text-white flex items-center gap-2">
                      <span>WhatsApp Message Templates</span>
                      <span className="text-xs font-normal text-[#475569] dark:text-[#94A3B8]">
                        ({waTemplates.length} of 4 configured)
                      </span>
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
                      Client-authored choices shown to visitors. Each choice opens WhatsApp with the prefilled message.
                    </p>
                  </div>
                  {waTemplates.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold text-[#315FEA] bg-[#315FEA]/10 border border-[#315FEA]/20 hover:bg-[#315FEA]/20 transition-colors shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Template</span>
                    </button>
                  )}
                </div>

                {/* Templates List */}
                <div className="space-y-4">
                  {waTemplates.map((template, idx) => {
                    const cleanDigits = waPhone.replace(/\D/g, '');
                    const phoneWithCode = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
                    const composedMsg = composeWhatsAppMessage(template.messageText, template.category);
                    const encodedMsg = encodeURIComponent(composedMsg);
                    const testUrl = phoneWithCode ? `https://wa.me/${phoneWithCode}?text=${encodedMsg}` : '';

                    return (
                      <div
                        key={template.id || idx}
                        className={`p-4 sm:p-5 rounded-[8px] border transition-all ${
                          template.isActive
                            ? 'bg-white dark:bg-[#0B1220] border-[#CBD5E1] dark:border-[#334155] shadow-xs'
                            : 'bg-[#F3F6FA] dark:bg-[#0F172A] border-[#E3E7ED] dark:border-[#1E293B] opacity-75'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-[#E3E7ED] dark:border-[#1E293B]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#172033] dark:text-white">
                              {template.title || `Template #${idx + 1}`}
                            </span>
                            {template.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] font-semibold">
                                {template.category}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-[4px] font-medium ${
                              template.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveTemplate(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveTemplate(idx, 'down')}
                              disabled={idx === waTemplates.length - 1}
                              className="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            {/* Active Toggle */}
                            <button
                              type="button"
                              onClick={() => handleUpdateTemplate(idx, 'isActive', !template.isActive)}
                              className={`px-2 py-1 rounded-[4px] text-[11px] font-medium border transition-colors ${
                                template.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                            >
                              {template.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {/* Delete Button */}
                            {waTemplates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(idx)}
                                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                title="Delete template"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title and Category Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          {/* Visitor-Facing Choice Title */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                                Visitor Choice Title *
                              </label>
                              <span className="text-[10px] text-slate-400">
                                {template.title.length}/100
                              </span>
                            </div>
                            <input
                              type="text"
                              value={template.title}
                              maxLength={100}
                              onChange={(e) => handleUpdateTemplate(idx, 'title', e.target.value)}
                              placeholder="e.g. Plan a New Project"
                              className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3 py-1.5 text-xs text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Action label displayed on the public website selector.
                            </p>
                          </div>

                          {/* Customer Intent / Service Category */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                                Service Category / Intent (Optional)
                              </label>
                              {tenantCategories.length > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  {tenantCategories.length} categories available
                                </span>
                              )}
                            </div>
                            {tenantCategories.length > 0 ? (
                              <div>
                                <select
                                  value={template.category || ''}
                                  onChange={(e) => handleUpdateTemplateCategory(idx, e.target.value)}
                                  className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3 py-1.5 text-xs text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
                                >
                                  <option value="">None / General Inquiry</option>
                                  {template.category && !tenantCategories.some((c) => c.name.toLowerCase() === template.category?.toLowerCase()) && (
                                    <option value={template.category}>
                                      {template.category} (Custom / Legacy)
                                    </option>
                                  )}
                                  {tenantCategories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                  <span>Dynamic categories from your offerings.</span>
                                  <Link
                                    href="/admin/images"
                                    className="text-[#315FEA] hover:underline font-medium inline-flex items-center gap-0.5"
                                  >
                                    <span>Manage in Images</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                    No categories configured yet
                                  </span>
                                  <Link
                                    href="/admin/images"
                                    className="text-[10px] text-[#315FEA] hover:underline font-medium inline-flex items-center gap-0.5"
                                  >
                                    <span>Configure in Images</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                </div>
                                <input
                                  type="text"
                                  value={template.category || ''}
                                  maxLength={100}
                                  onChange={(e) => handleUpdateTemplate(idx, 'category', e.target.value)}
                                  placeholder="e.g. Modular Systems, Full Home Interior"
                                  className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3 py-1.5 text-xs text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Prefilled WhatsApp Message */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                              Prefilled WhatsApp Message *
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {template.messageText.length}/1000
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={template.messageText}
                            maxLength={1000}
                            onChange={(e) => handleUpdateTemplate(idx, 'messageText', e.target.value)}
                            placeholder="Client-authored prefilled text opening in WhatsApp..."
                            className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3 py-1.5 text-xs text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA] resize-none"
                          />
                        </div>

                        {/* Quick Preset Starter Chips */}
                        <div className="mb-3 p-2.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                            <Sparkles className="w-3 h-3 text-[#7950B8]" />
                            <span>Quick Insert Starters:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {TEMPLATE_PRESETS.map((preset) => (
                              <button
                                key={preset.title}
                                type="button"
                                onClick={() => handleApplyPreset(idx, preset)}
                                className="px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 hover:border-[#315FEA] text-[#172033] dark:text-slate-200 hover:text-[#315FEA] transition-colors"
                              >
                                {preset.title}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Realistic WhatsApp Chat Bubble Preview */}
                        <div className="p-3 rounded-[6px] bg-[#ECE5DD] dark:bg-[#111B21] border border-[#D1D7DB] dark:border-[#222E35]">
                          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                                <MessageCircle className="w-2.5 h-2.5" />
                              </div>
                              <span className="text-[10px] font-bold text-[#111B21] dark:text-slate-200">
                                WhatsApp Chat Preview {phoneWithCode ? `(+${phoneWithCode})` : ''}
                              </span>
                            </div>
                            {testUrl && (
                              <a
                                href={testUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-800 dark:text-emerald-400 hover:underline font-semibold"
                              >
                                <span>Test wa.me Link</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div className="max-w-[92%] ml-auto bg-[#D9FDD3] dark:bg-[#005C4B] rounded-[7.5px] rounded-tr-none px-3 py-2 shadow-xs text-[#111B21] dark:text-white text-xs leading-relaxed">
                            <p className="whitespace-pre-wrap break-words text-[11px]">
                              {composedMsg || '(Empty message)'}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#667781] dark:text-emerald-200/80">
                              <span>10:30 AM</span>
                              <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visitor Choices Preview Card */}
                <div className="p-4 rounded-[6px] bg-[#F5F0FB] dark:bg-[#1E1B2E] border border-[#E3E7ED] dark:border-[#332A4A]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-[#7950B8] dark:text-[#A78BFA] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Public Choices Preview</span>
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Unified Floating Selector
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] dark:text-slate-300 mb-3">
                    Website visitors will see these options inside the compact floating contact menu:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {waTemplates.filter(t => t.isActive).map((t) => (
                      <div
                        key={t.id}
                        className="px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#0B1220] border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>{t.title}</span>
                        {t.category && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-normal">
                            {t.category}
                          </span>
                        )}
                      </div>
                    ))}
                    {waTemplates.filter(t => t.isActive).length === 0 && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                        No active templates. Activate at least one template above.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={waSaving}
                  loadingText="Saving WhatsApp Settings..."
                  leftIcon={<Save className="w-4 h-4" />}
                  className="px-6 rounded-[6px]"
                >
                  Save WhatsApp Settings
                </Button>
              </div>
            </form>
          </div>

          {/* Panel 2: Social Profile Links (Facebook & Instagram) */}
          <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3E7ED] dark:border-[#1E293B]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center border border-[#315FEA]/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#172033] dark:text-white">
                    Social Profile Links
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
                    Configure official Facebook and Instagram outbound links shown on your live website header, footer, and contact controls.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSocial} className="mt-6 space-y-6">
              {socialError && (
                <div className="p-3.5 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{socialError}</span>
                </div>
              )}

              {/* Facebook Section */}
              <div className="p-4 rounded-[6px] bg-[#F3F6FA] dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#334155] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[6px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800">
                      <Facebook className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172033] dark:text-white">
                        Facebook Page Link
                      </p>
                      <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                        Show external Facebook page link on live website
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={facebookEnabled}
                      onChange={(e) => setFacebookEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#315FEA]"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] mb-1">
                    Facebook Profile / Page URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={facebookUrl}
                      onChange={(e) => {
                        setFacebookUrl(e.target.value);
                        if (socialError) setSocialError(null);
                      }}
                      placeholder="https://facebook.com/yourbrand"
                      className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3.5 py-2 text-sm text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
                    />
                  </div>
                  {facebookUrl && (
                    <div className="mt-1.5 flex justify-end">
                      <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#315FEA] hover:underline"
                      >
                        <span>Test Facebook Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Instagram Section */}
              <div className="p-4 rounded-[6px] bg-[#F3F6FA] dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#334155] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[6px] bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-200 dark:bg-pink-950/40 dark:border-pink-800">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172033] dark:text-white">
                        Instagram Profile Link
                      </p>
                      <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                        Show external Instagram profile link on live website
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={instagramEnabled}
                      onChange={(e) => setInstagramEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#315FEA]"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] mb-1">
                    Instagram Profile URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => {
                        setInstagramUrl(e.target.value);
                        if (socialError) setSocialError(null);
                      }}
                      placeholder="https://instagram.com/yourbrand"
                      className="w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3.5 py-2 text-sm text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
                    />
                  </div>
                  {instagramUrl && (
                    <div className="mt-1.5 flex justify-end">
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#315FEA] hover:underline"
                      >
                        <span>Test Instagram Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={socialSaving}
                  loadingText="Saving Social Links..."
                  leftIcon={<Save className="w-4 h-4" />}
                  className="px-6 rounded-[6px]"
                >
                  Save Social Profile Links
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <KeyRound className="w-5 h-5 mr-2 text-[#3B82F6]" />
                Password &amp; Authentication
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
                Your account credentials and active authentication session state.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Password Protection</p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Encrypted using BCrypt adaptive key hashing with secure salting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/forgot-password?email=${encodeURIComponent(user?.email || '')}`)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors shrink-0 shadow-sm"
              >
                Send Password Reset Link
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Session Security</span>
                <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Active (HTTP-Only Secure Cookie)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Email Verification</span>
                <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Tenant Isolation</span>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  Enforced Server-Side
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

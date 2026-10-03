'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  RefreshCw,
  Check,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  ImageIcon,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorState } from '@/components/ui/ErrorState';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';

interface AIProvider {
  key: string;
  displayName: string;
  description: string;
  supportedCapabilities: string[];
  defaultModelKey: string;
  documentationUrl?: string;
  placeholder?: string;
}

interface AIModel {
  key: string;
  providerKey: string;
  displayName: string;
  description: string;
  capability: string; // "Content", "Image", "Both"
  status: string; // "Available", "Unavailable", "Deprecated"
  isDefault: boolean;
  isRecommended: boolean;
  isSelected: boolean;
}

interface AIConnection {
  status: string; // "Connected", "NotConnected", "Invalid"
  providerKey?: string;
  providerDisplayName?: string;
  selectedModelKey?: string;
  selectedModelDisplayName?: string;
  maskedApiKey?: string;
  supportedCapability?: string;
  lastValidatedAt?: string;
  updatedAt?: string;
}

export default function AiConnectionsPage() {
  const [connection, setConnection] = useState<AIConnection | null>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection Setup Form State
  const [selectedProviderKey, setSelectedProviderKey] = useState<string>('openai');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModelKey, setSelectedModelKey] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingConnection, setSavingConnection] = useState(false);

  // Modals State
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [rotateApiKeyInput, setRotateApiKeyInput] = useState('');
  const [showRotateApiKey, setShowRotateApiKey] = useState(false);
  const [rotating, setRotating] = useState(false);

  const [isChangeModelModalOpen, setIsChangeModelModalOpen] = useState(false);
  const [pendingModelKey, setPendingModelKey] = useState('');
  const [updatingModel, setUpdatingModel] = useState(false);

  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    document.title = 'Sparovia Admin — AI Connections';
  }, []);

  // Load initial data: connection status, providers, models
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [connRes, provRes, modRes] = await Promise.all([
        apiClient.fetch<{ data: AIConnection }>('/ai/connection'),
        apiClient.fetch<{ data: AIProvider[] }>('/ai/providers'),
        apiClient.fetch<{ data: { models: AIModel[] } }>('/ai/models')
      ]);

      if (connRes?.data) {
        setConnection(connRes.data);
      }
      if (provRes?.data) {
        setProviders(provRes.data);
      }
      if (modRes?.data?.models) {
        setModels(modRes.data.models);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load AI connection settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync selected model default when provider changes in setup mode
  useEffect(() => {
    if (selectedProviderKey && models.length > 0) {
      const providerModels = models.filter(m => m.providerKey.toLowerCase() === selectedProviderKey.toLowerCase());
      const def = providerModels.find(m => m.isDefault) || providerModels[0];
      if (def && (!selectedModelKey || !providerModels.some(m => m.key === selectedModelKey))) {
        setSelectedModelKey(def.key);
      }
    }
  }, [selectedProviderKey, models, selectedModelKey]);

  const activeProvider = useMemo(() => {
    if (connection?.providerKey) {
      return providers.find(p => p.key.toLowerCase() === connection.providerKey?.toLowerCase());
    }
    return providers.find(p => p.key.toLowerCase() === selectedProviderKey.toLowerCase());
  }, [connection, providers, selectedProviderKey]);

  const activeModel = useMemo(() => {
    if (connection?.selectedModelKey) {
      return models.find(m => m.key === connection.selectedModelKey);
    }
    return models.find(m => m.key === selectedModelKey);
  }, [connection, models, selectedModelKey]);

  const currentProviderModels = useMemo(() => {
    const provKey = connection?.providerKey || selectedProviderKey;
    return models.filter(m => m.providerKey.toLowerCase() === provKey.toLowerCase());
  }, [models, connection, selectedProviderKey]);

  const isConnected = connection?.status === 'Connected';

  // Handle Testing Connection in Setup Mode
  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter an API key to test the connection.');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await apiClient.fetch<{ data: { success: boolean; message: string } }>('/ai/connection/test', {
        method: 'POST',
        body: JSON.stringify({
          providerKey: selectedProviderKey,
          apiKey: apiKeyInput.trim()
        })
      });

      if (res?.data?.success) {
        setTestResult({ success: true, message: res.data.message || 'Connection verified successfully.' });
        toast.success('Connection verified successfully!');
      } else {
        setTestResult({ success: false, message: 'Authentication failed. Please verify your API key.' });
      }
    } catch (err: any) {
      const msg = err.message || 'Could not authenticate with provider. Please check your API key.';
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTestingConnection(false);
    }
  };

  // Handle Saving Initial Connection
  const handleSaveConnection = async () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter an API key before connecting.');
      return;
    }
    if (!selectedModelKey) {
      toast.error('Please select an approved AI model.');
      return;
    }

    setSavingConnection(true);

    try {
      const res = await apiClient.fetch<{ data: AIConnection }>('/ai/connection', {
        method: 'POST',
        body: JSON.stringify({
          providerKey: selectedProviderKey,
          apiKey: apiKeyInput.trim(),
          selectedModelKey: selectedModelKey
        })
      });

      if (res?.data) {
        setConnection(res.data);
        setApiKeyInput('');
        setTestResult(null);
        toast.success(`${res.data.providerDisplayName || 'AI Provider'} connected successfully!`);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save AI configuration. Please check your credentials.');
    } finally {
      setSavingConnection(false);
    }
  };

  // Handle Rotating Stored API Key
  const handleRotateKey = async () => {
    if (!rotateApiKeyInput.trim()) {
      toast.error('Please enter a new API key.');
      return;
    }

    setRotating(true);
    try {
      const res = await apiClient.fetch<{ data: AIConnection }>('/ai/connection', {
        method: 'PUT',
        body: JSON.stringify({
          apiKey: rotateApiKeyInput.trim()
        })
      });

      if (res?.data) {
        setConnection(res.data);
        setRotateApiKeyInput('');
        setIsRotateModalOpen(false);
        toast.success('API key updated and verified successfully.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not verify the new API key. Previous key was preserved.');
    } finally {
      setRotating(false);
    }
  };

  // Handle Changing Active Model
  const handleChangeModel = async (targetModelKey: string) => {
    setUpdatingModel(true);
    try {
      const res = await apiClient.fetch<{ data: AIConnection }>('/ai/connection', {
        method: 'PUT',
        body: JSON.stringify({
          selectedModelKey: targetModelKey
        })
      });

      if (res?.data) {
        setConnection(res.data);
        setIsChangeModelModalOpen(false);
        toast.success(`Active model updated to ${res.data.selectedModelDisplayName || targetModelKey}.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update model selection.');
    } finally {
      setUpdatingModel(false);
    }
  };

  // Handle Disconnecting Provider
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await apiClient.fetch('/ai/connection', {
        method: 'DELETE'
      });

      setConnection({ status: 'NotConnected' });
      setIsDisconnectModalOpen(false);
      setApiKeyInput('');
      setTestResult(null);
      toast.success('AI provider disconnected successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect AI provider.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6 animate-in fade-in duration-150">
      {/* 1. Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI Connections
          </h1>
          <InfoTooltip content="Connect an approved external AI provider (OpenAI, Google Gemini, Anthropic Claude) using your account API credential. A single active AI connection powers both Content AI assistance and Image Enhancement workflows when a compatible model is selected." />
        </div>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
          Manage your AI provider credentials and model selection. Your single AI configuration powers both website content refinement and image quality enhancement.
        </p>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading AI connections">
          <div className="h-44 bg-slate-100 dark:bg-[#1E293B]/50 rounded-2xl border border-slate-200 dark:border-[#334155]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-48 bg-slate-100 dark:bg-[#1E293B]/50 rounded-2xl border border-slate-200 dark:border-[#334155]" />
            <div className="h-48 bg-slate-100 dark:bg-[#1E293B]/50 rounded-2xl border border-slate-200 dark:border-[#334155]" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load AI configuration"
          error={error || undefined}
          onRetry={loadData}
        />
      ) : isConnected ? (
        /* CONNECTED STATE */
        <div className="space-y-6">
          {/* CURRENT ACTIVE CONNECTION SUMMARY CARD */}
          <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
            {/* Top Row: Provider / Model & Status */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0F172A]/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] dark:bg-[#3B82F6]/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {connection.providerDisplayName || connection.providerKey}
                    </span>
                    <span className="text-slate-400 dark:text-[#64748B]">/</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-[#CBD5E1]">
                      {connection.selectedModelDisplayName || connection.selectedModelKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                    Active foundation AI connection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
                {activeModel?.capability === 'Both' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                    <Sparkles className="w-3 h-3" />
                    Multimodal
                  </span>
                )}
              </div>
            </div>

            {/* Information Grid: 3 Equal Columns */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Column 1: API Credential */}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  API Credential
                </dt>
                <dd className="mt-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-800 dark:text-[#CBD5E1] bg-slate-50 dark:bg-[#0B1220] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] w-fit">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{connection.maskedApiKey || '••••••••••••••••'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#64748B] mt-1">
                    Encrypted with AES-256-GCM.
                  </p>
                </dd>
              </div>

              {/* Column 2: Model Capabilities */}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Model Capabilities
                </dt>
                <dd className="mt-1.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Content AI</span>
                  </div>
                  {activeModel?.capability === 'Both' ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Image Enhancement</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#64748B]">
                        <span className="w-3.5 text-center font-bold shrink-0">—</span>
                        <span>Image Unsupported</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#64748B] mt-0.5 leading-snug">
                        Switch to a multimodal model to unlock image enhancement.
                      </p>
                    </div>
                  )}
                </dd>
              </div>

              {/* Column 3: Last Validated */}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Last Validated
                </dt>
                <dd className="mt-1.5 text-xs text-slate-700 dark:text-[#CBD5E1] font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {connection.lastValidatedAt 
                      ? new Date(connection.lastValidatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Verified on connection'}
                  </span>
                </dd>
              </div>
            </div>

            {/* Actions Row */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1E293B] bg-slate-50/30 dark:bg-[#0F172A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPendingModelKey(connection.selectedModelKey || '');
                    setIsChangeModelModalOpen(true);
                  }}
                  leftIcon={<Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />}
                  className="text-xs"
                >
                  Change Model
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRotateApiKeyInput('');
                    setIsRotateModalOpen(true);
                  }}
                  leftIcon={<Key className="w-3.5 h-3.5 text-[#8B3FD1]" />}
                  className="text-xs"
                >
                  Rotate API Key
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDisconnectModalOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
              >
                Disconnect
              </Button>
            </div>
          </section>

          {/* AVAILABLE MODELS FOR CONNECTED PROVIDER */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Available Models for {connection.providerDisplayName || connection.providerKey}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                Select an approved model to power your active AI workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentProviderModels.map(model => {
                const isSelected = model.key === connection.selectedModelKey;
                const isMultimodal = model.capability === 'Both';

                return (
                  <div
                    key={model.key}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/40 dark:bg-[#0B1220] border-[#3B82F6] ring-1 ring-[#3B82F6]/30 shadow-sm'
                        : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-[#334155]'
                    }`}
                  >
                    <div>
                      {/* Model Title & Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {model.displayName}
                          </h3>
                          {model.isRecommended && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              Recommended
                            </span>
                          )}
                        </div>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Available
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-4">
                        {model.description}
                      </p>
                    </div>

                    {/* Aligned Card Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3 mt-auto">
                      <div className="text-[11px] text-slate-500 dark:text-[#64748B]">
                        Capability: <strong className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{model.capability}</strong>
                      </div>

                      {isSelected ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          className="text-xs font-medium opacity-90 cursor-default"
                        >
                          ✓ Current Model
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={model.isRecommended ? 'primary' : 'outline'}
                          onClick={() => handleChangeModel(model.key)}
                          disabled={updatingModel}
                          className="text-xs font-medium"
                        >
                          {updatingModel ? 'Updating...' : 'Select Model'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        /* NOT CONNECTED / GUIDED CONNECTION WORKFLOW */
        <div className="space-y-6">
          {/* STEP 1: CHOOSE PROVIDER */}
          <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] dark:bg-[#3B82F6]/20 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Choose AI Provider
              </h2>
              <InfoTooltip content="Select an external foundation AI provider. You will supply your own API key to connect your account directly." />
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] -mt-2">
              Choose the foundation AI provider you would like to connect with Sparovia.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {providers.map(provider => {
                const isSelected = selectedProviderKey.toLowerCase() === provider.key.toLowerCase();
                return (
                  <button
                    key={provider.key}
                    type="button"
                    onClick={() => {
                      setSelectedProviderKey(provider.key);
                      setTestResult(null);
                    }}
                    className={`rounded-xl p-4 text-left border transition-all flex flex-col justify-between h-full ${
                      isSelected
                        ? 'border-[#3B82F6] bg-blue-50/50 dark:bg-[#0B1220] ring-1 ring-[#3B82F6] shadow-sm'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1220]/40 hover:border-slate-300 dark:hover:border-[#334155]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {provider.displayName}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed mb-3">
                        {provider.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] text-[11px] text-slate-500 dark:text-[#64748B] mt-auto">
                      Capabilities: Content &amp; Vision
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 2: ENTER API KEY */}
          <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] dark:bg-[#3B82F6]/20 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enter API Key
              </h2>
              <InfoTooltip content="Enter your API secret key from your provider console (e.g. OpenAI, Google AI Studio, Anthropic). Sparovia uses your key solely to execute your approved content and image requests. Credentials are encrypted at rest using strong AES-256-GCM encryption, never logged, and never displayed back in plaintext." />
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] -mt-2">
              Your API key is encrypted at rest and never shared with other tenants or logged.
            </p>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="apiKeyInput"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]"
                  >
                    <span>{activeProvider?.displayName || 'Provider'} API Key</span>
                    <InfoTooltip content="Your API key is stored securely with AES-256-GCM encryption and is only used to communicate with the provider." />
                  </label>
                  {activeProvider?.documentationUrl && (
                    <a
                      href={activeProvider.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#3B82F6] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Get API Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="apiKeyInput"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder={activeProvider?.placeholder || 'sk-...'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all pr-10"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#CBD5E1] transition-colors p-1"
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clean Baseline Test Connection Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !apiKeyInput.trim()}
                  leftIcon={
                    testingConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#3B82F6]" />
                    )
                  }
                  className="text-xs"
                >
                  {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                </Button>

                {testResult && (
                  <div className={`text-xs flex items-center gap-1.5 font-medium ${
                    testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STEP 3: SELECT MODEL */}
          <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] dark:bg-[#3B82F6]/20 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Select AI Model
              </h2>
              <InfoTooltip content="Choose an approved model from this provider. Models with multimodal capabilities support both text copy generation and visual image enhancement." />
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] -mt-2">
              Select an approved model for {activeProvider?.displayName || 'this provider'}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {currentProviderModels.map(model => {
                const isSelected = selectedModelKey === model.key;
                const isMultimodal = model.capability === 'Both';

                return (
                  <button
                    key={model.key}
                    type="button"
                    onClick={() => setSelectedModelKey(model.key)}
                    className={`rounded-2xl p-5 text-left border transition-all flex flex-col justify-between h-full ${
                      isSelected
                        ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-[#0B1220] ring-1 ring-[#3B82F6] shadow-sm'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1220]/40 hover:border-slate-300 dark:hover:border-[#334155]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {model.displayName}
                          </span>
                          {model.isRecommended && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              Recommended
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed mb-4">
                        {model.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs mt-auto">
                      <span className="text-slate-500 dark:text-[#64748B]">
                        Capability: <strong className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{model.capability}</strong>
                      </span>
                      {isMultimodal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                          Content + Image
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          Content Only
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* PRIMARY SAVE CTA: Aligned to container right edge */}
          <div className="flex items-center justify-end pt-1">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveConnection}
              disabled={savingConnection || !apiKeyInput.trim() || !selectedModelKey}
              leftIcon={
                savingConnection ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
              className="w-full sm:w-auto px-7"
            >
              {savingConnection ? 'Saving AI Configuration...' : 'Connect & Save AI Configuration'}
            </Button>
          </div>
        </div>
      )}

      {/* Security & Privacy Guarantee Footer Card */}
      <section className="bg-slate-50 dark:bg-[#0B1220]/70 border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-600 dark:text-[#94A3B8]">
          <strong className="font-semibold text-slate-900 dark:text-white block mb-0.5">
            Enterprise Tenant Isolation &amp; Security
          </strong>
          API keys are encrypted using AES-256-GCM authenticated encryption and stored strictly within your tenant boundary. Plaintext keys are never returned to the frontend, never stored in browser memory, and never logged. AI assistance is strictly optional; all suggestions remain drafts until your explicit review.
        </div>
      </section>

      {/* ROTATE API KEY MODAL */}
      <Modal
        isOpen={isRotateModalOpen}
        onClose={() => {
          setIsRotateModalOpen(false);
          setRotateApiKeyInput('');
        }}
        title="Rotate API Key"
        description="Replace the current stored credential with a new API key"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
            Enter the new API key for <strong>{connection?.providerDisplayName || 'your provider'}</strong>. The new key will be tested before replacing the existing credential.
          </p>

          <div className="space-y-1.5">
            <label 
              htmlFor="rotateApiKeyInput"
              className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]"
            >
              New API Key
            </label>
            <div className="relative">
              <input
                id="rotateApiKeyInput"
                type={showRotateApiKey ? 'text' : 'password'}
                value={rotateApiKeyInput}
                onChange={(e) => setRotateApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowRotateApiKey(!showRotateApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#CBD5E1] transition-colors p-1"
                aria-label={showRotateApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showRotateApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRotateModalOpen(false);
                setRotateApiKeyInput('');
              }}
              disabled={rotating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRotateKey}
              disabled={rotating || !rotateApiKeyInput.trim()}
              className="gap-1.5"
            >
              {rotating ? 'Verifying & Saving...' : 'Update API Key'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CHANGE MODEL MODAL */}
      <Modal
        isOpen={isChangeModelModalOpen}
        onClose={() => setIsChangeModelModalOpen(false)}
        title="Change Active AI Model"
        description="Select an approved model to power future AI workflows"
      >
        <div className="space-y-4">
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {currentProviderModels.map(model => {
              const isSelected = (pendingModelKey || connection?.selectedModelKey) === model.key;
              return (
                <button
                  key={model.key}
                  type="button"
                  onClick={() => setPendingModelKey(model.key)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#3B82F6] bg-blue-50/50 dark:bg-[#0B1220] ring-1 ring-[#3B82F6]'
                      : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {model.displayName}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#3B82F6] shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    {model.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangeModelModalOpen(false)}
              disabled={updatingModel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => pendingModelKey && handleChangeModel(pendingModelKey)}
              disabled={updatingModel || !pendingModelKey || pendingModelKey === connection?.selectedModelKey}
              className="gap-1.5"
            >
              {updatingModel ? 'Updating...' : 'Confirm Model'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DISCONNECT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title="Disconnect AI Provider?"
        description="Confirm disconnecting your external AI account"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
            Are you sure you want to disconnect <strong>{connection?.providerDisplayName || 'your provider'}</strong>?
          </p>

          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 space-y-1.5">
            <p>• Stored encrypted API credentials will be permanently cleared.</p>
            <p>• Content AI and Image AI assistance will be unavailable until a provider is reconnected.</p>
            <p>• Your published website content and images will NOT be affected.</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDisconnectModalOpen(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent gap-1.5"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Provider'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

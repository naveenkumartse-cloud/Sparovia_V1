'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ServicesSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormField } from '@/components/ui/FormField';
import { ArrowLeft, ArrowRight, Plus, Trash2, Layers, RefreshCw, Sparkles } from 'lucide-react';
import { AIContentModal } from '@/components/ai/AIContentModal';

interface ServiceItem {
  id: string;
  serviceName: string;
  serviceDescription?: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [error, setError] = useState('');
  const [aiModal, setAiModal] = useState<{
    fieldKey: string;
    fieldLabel: string;
    currentText: string;
  } | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<ServiceItem[]>('/onboarding/services');
      setServices(response || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setIsAdding(true);
    setError('');
    try {
      const added = await apiClient.post<ServiceItem>('/onboarding/services', {
        serviceName: newServiceName.trim(),
        serviceDescription: newServiceDesc.trim(),
      });
      setServices([...services, added]);
      setNewServiceName('');
      setNewServiceDesc('');
      toast.success(`Service "${added.serviceName}" added successfully.`);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to add service.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    setDeletingId(id);
    setError('');
    try {
      await apiClient.delete(`/onboarding/services/${id}`);
      setServices(services.filter(s => s.id !== id));
      setConfirmDeleteId(null);
      toast.success(`Service "${name}" removed successfully.`);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove service.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleContinue = () => {
    if (fromAdmin) {
      router.push('/admin/business-context');
    } else {
      router.push('/admin/onboarding/location-customers');
    }
  };

  if (isLoading) {
    return <ServicesSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <Layers className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Services
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Add the primary products or services your business offers to customers.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Existing Services List */}
      <div className="space-y-3 mb-6">
        {services.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-6 h-6 text-[#3B82F6]" />}
            title="No services added yet"
            description="Add your first service using the form below to showcase your business capabilities."
          />
        ) : (
          services.map(service => {
            const isDeleting = deletingId === service.id;
            const isConfirming = confirmDeleteId === service.id;

            return (
              <div 
                key={service.id} 
                className="p-4 bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl flex items-start justify-between gap-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{service.serviceName}</h3>
                  {service.serviceDescription && (
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 whitespace-pre-line">{service.serviceDescription}</p>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center">
                  {isConfirming ? (
                    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg p-1">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium px-1.5">Remove?</span>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDeleteService(service.id, service.serviceName)}
                        className="inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded transition-colors"
                      >
                        {isDeleting ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(service.id)}
                      className="text-slate-400 hover:text-red-500 dark:text-[#64748B] dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                      aria-label={`Remove ${service.serviceName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Service Form */}
      <div className="p-5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155]/60 rounded-xl mb-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-1.5 text-[#3B82F6]" />
          Add a Service
        </h3>
        <form onSubmit={handleAddService} className="space-y-4">
          <FormField
            id="serviceName"
            label="Service Name"
            required
            tooltip="The primary title of your offering (e.g. Architectural Glazing, UPVC Casement Windows)."
          >
            <input
              id="serviceName"
              type="text"
              required
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              disabled={isAdding}
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
              placeholder="e.g. UPVC Window Installation"
              className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-60"
            />
          </FormField>

          <FormField
            id="serviceDesc"
            label="Description"
            tooltip="A concise summary of what this service entails and what makes it appealing to clients."
            action={
              <button
                type="button"
                onClick={() =>
                  setAiModal({
                    fieldKey: 'serviceDescription',
                    fieldLabel: 'Service Description',
                    currentText: newServiceDesc,
                  })
                }
                disabled={!newServiceDesc.trim()}
                title={newServiceDesc.trim() ? 'Improve with AI' : 'Enter some text first to improve with AI'}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Improve with AI</span>
              </button>
            }
          >
            <textarea
              id="serviceDesc"
              rows={2}
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              disabled={isAdding}
              value={newServiceDesc}
              onChange={e => setNewServiceDesc(e.target.value)}
              placeholder="Energy-efficient window systems custom fitted for residential properties..."
              className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-60"
            />
          </FormField>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isAdding || !newServiceName.trim()}
              isLoading={isAdding}
              loadingText="Adding..."
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Service
            </Button>
          </div>
        </form>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/admin/onboarding/business-basics')}
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </button>

        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
        >
          {fromAdmin ? 'Save & Return' : 'Save & Continue'}
        </Button>
      </div>

      {aiModal && (
        <AIContentModal
          isOpen={!!aiModal}
          onClose={() => setAiModal(null)}
          fieldKey={aiModal.fieldKey}
          fieldLabel={aiModal.fieldLabel}
          sectionKey="services"
          sectionTitle="Services"
          currentText={aiModal.currentText}
          onApply={(improved) => {
            setNewServiceDesc(improved);
          }}
        />
      )}
    </div>
  );
}

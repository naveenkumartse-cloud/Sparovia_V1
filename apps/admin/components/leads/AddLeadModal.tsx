'use client';

import React, { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { cleanPhoneInput, isValidIndianPhone } from '@/lib/validation/authValidation';
import { TenantWorkCategory } from './LeadTypes';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TenantWorkCategory[];
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string | null;
    message: string;
    areaOfInterest: string | null;
    areaOfInterestCategoryId: string | null;
    source: string;
    status: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function AddLeadModal({
  isOpen,
  onClose,
  categories,
  onSubmit,
  isLoading,
}: AddLeadModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState('New');
  const [areaOfInterest, setAreaOfInterest] = useState('');
  const [areaOfInterestCategoryId, setAreaOfInterestCategoryId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setSource('Manual');
    setStatus('New');
    setAreaOfInterest('');
    setAreaOfInterestCategoryId('');
    setMessage('');
    setError(null);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedName = name.trim();
    const cleanDigits = cleanPhoneInput(phone);
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter the customer name.');
      return;
    }
    if (!cleanDigits) {
      setError('Please enter the customer phone number.');
      return;
    }
    if (!isValidIndianPhone(cleanDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!trimmedMessage) {
      setError('Please enter customer enquiry requirements or project scope.');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        name: trimmedName,
        phone: `+91${cleanDigits}`,
        email: trimmedEmail || null,
        message: trimmedMessage,
        areaOfInterest: areaOfInterest || null,
        areaOfInterestCategoryId: areaOfInterestCategoryId || null,
        source,
        status,
      });
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer lead.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      preventOutsideClose={isLoading}
      title="Add Customer Lead"
      description="Record a new customer enquiry manually into your workspace."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormField label="Customer Name" required>
          <Input
            type="text"
            required
            placeholder="e.g. Anand Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PhoneInput
            label="Phone Number"
            required
            value={phone}
            onChange={(digits) => setPhone(digits)}
            disabled={isLoading}
          />

          <FormField label="Email Address (Optional)">
            <Input
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Source Channel">
            <Select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isLoading}
            >
              <option value="Manual">Manual</option>
              <option value="Website">Website</option>
              <option value="WhatsApp">WhatsApp</option>
            </Select>
          </FormField>

          <FormField label="Initial Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading}
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Closed">Closed</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Area of Interest">
          <Select
            value={areaOfInterest}
            onChange={(e) => {
              const selected = categories.find((c) => c.name === e.target.value);
              setAreaOfInterest(e.target.value);
              setAreaOfInterestCategoryId(selected ? selected.id : '');
            }}
            disabled={isLoading}
          >
            <option value="">Select an area of interest (optional)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Project Enquiry / Requirements" required>
          <Textarea
            required
            rows={3}
            placeholder="Enter customer enquiry message or project scope..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-[6px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Saving..."
            className="rounded-[6px]"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Save Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}

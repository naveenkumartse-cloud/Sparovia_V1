'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { cleanPhoneInput, isValidIndianPhone } from '@/lib/validation/authValidation';
import { Lead, TenantWorkCategory } from './LeadTypes';

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  categories: TenantWorkCategory[];
  onSubmit: (leadId: string, data: {
    name: string;
    phone: string;
    email: string | null;
    message: string;
    areaOfInterest: string | null;
    areaOfInterestCategoryId: string | null;
    status: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function EditLeadModal({
  lead,
  isOpen,
  onClose,
  categories,
  onSubmit,
  isLoading,
}: EditLeadModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('New');
  const [areaOfInterest, setAreaOfInterest] = useState('');
  const [areaOfInterestCategoryId, setAreaOfInterestCategoryId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setPhone(cleanPhoneInput(lead.phone));
      setEmail(lead.email || '');
      setStatus(lead.status);
      setAreaOfInterest(lead.areaOfInterest || '');
      setAreaOfInterestCategoryId(lead.areaOfInterestCategoryId || '');
      setMessage(lead.message);
      setError(null);
    }
  }, [lead]);

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || isLoading) return;

    const trimmedName = name.trim();
    const cleanDigits = cleanPhoneInput(phone);
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Customer name is required.');
      return;
    }
    if (!cleanDigits) {
      setError('Customer phone number is required.');
      return;
    }
    if (!isValidIndianPhone(cleanDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!trimmedMessage) {
      setError('Customer requirements message is required.');
      return;
    }

    setError(null);
    try {
      await onSubmit(lead.id, {
        name: trimmedName,
        phone: `+91${cleanDigits}`,
        email: trimmedEmail || null,
        message: trimmedMessage,
        areaOfInterest: areaOfInterest || null,
        areaOfInterestCategoryId: areaOfInterestCategoryId || null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update customer lead.');
    }
  };

  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      preventOutsideClose={isLoading}
      title="Edit Customer Lead"
      description="Update customer contact details, area of interest, or enquiry specifications."
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
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

          <FormField label="Email Address">
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

          <FormField label="Pipeline Status">
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

        <FormField label="Project Enquiry / Requirements" required>
          <Textarea
            required
            rows={3}
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
            leftIcon={<Check className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

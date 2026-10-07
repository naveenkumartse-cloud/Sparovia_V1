'use client';

import { useState, useRef } from 'react';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactSection() {
  const { contact, ourWork, tenantCategories, website } = useTemplateContent();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Authoritative tenant categories (excluding navigation concept "All")
  const areaOptions = Array.isArray(tenantCategories) && tenantCategories.length > 0
    ? tenantCategories
    : (ourWork?.categories || []).filter((c) => c.toLowerCase() !== 'all');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    areaOfInterest: '',
    projectDetails: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions from rapid double-clicks or event propagation
    if (isSubmittingRef.current || loading) {
      return;
    }

    setError(null);

    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedProjectDetails = formData.projectDetails.trim();
    const trimmedArea = formData.areaOfInterest ? formData.areaOfInterest.trim() : null;

    // 1. Frontend validation with clear user-facing messages
    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (!trimmedPhone) {
      setError('Please enter your phone number.');
      return;
    }

    const phoneDigits = trimmedPhone.replace(/[^\d]/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
      setError('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return;
    }
    const fullPhone = `+91${phoneDigits}`;

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (!trimmedProjectDetails) {
      setError('Please enter your project requirements.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 20000);

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5043/api/v1';
      apiUrl = apiUrl.replace(/\/+$/, '');
      if (!apiUrl.endsWith('/api/v1')) {
        apiUrl = `${apiUrl}/api/v1`;
      }

      const domain = typeof window !== 'undefined' ? (website?.domain || window.location.hostname) : undefined;

      const res = await fetch(`${apiUrl}/leads/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          name: trimmedName,
          phone: fullPhone,
          email: trimmedEmail || null,
          areaOfInterest: trimmedArea,
          service: trimmedArea, // backward compatibility
          message: trimmedProjectDetails, // Maps UI "projectDetails" to API property "message"
          domain: domain || undefined,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMessage = "We couldn't send your enquiry right now. Please try again.";
        try {
          const data = await res.json();
          if (res.status === 429) {
            errMessage = "Too many requests. Please wait a moment and try again.";
          } else if (res.status === 404) {
            errMessage = "Business website not found. Please try again later.";
          } else if (data?.errors && typeof data.errors === 'object') {
            const firstKey = Object.keys(data.errors)[0];
            if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length > 0) {
              errMessage = data.errors[firstKey][0];
            }
          } else if (data?.error) {
            errMessage = typeof data.error === 'string' ? data.error : (data.error.message || errMessage);
          } else if (data?.message) {
            errMessage = data.message;
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errMessage);
      }

      setSubmitted(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        areaOfInterest: '',
        projectDetails: '',
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err.message || "We couldn't send your enquiry right now. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const brandName = website?.name || 'Sparovia';

  return (
    <Section id="contact" background="white" padding="spacious">
      <Container>
        <div className="max-w-2xl mx-auto w-full">
          <FadeIn direction="up">
            <div className="bg-surface p-5 sm:p-8 md:p-12 rounded-3xl border border-gray-200 shadow-soft-sm">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center mx-auto mb-6 text-brand-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-sans text-2xl font-bold text-charcoal-900 mb-2">
                    Inquiry Received
                  </h3>
                  <p className="text-sm text-charcoal-600 font-normal mb-8 max-w-sm mx-auto">
                    Thank you for contacting {brandName}. Your enquiry has been submitted successfully.
                  </p>
                  <Button onClick={() => setSubmitted(false)} variant="primary" size="md">
                    Send Another Request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Eyebrow icon={false}>{contact.eyebrow || 'CONTACT'}</Eyebrow>

                  <h3 className="font-sans text-2xl sm:text-3xl font-bold text-charcoal-900 mb-2">
                    {contact.heading || 'Request a Quote'}
                  </h3>

                  {contact.description && (
                    <p className="text-sm text-charcoal-600 mb-6 font-normal">
                      {contact.description}
                    </p>
                  )}

                  <div>
                    <label htmlFor="user-name" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                      Your Name *
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (error) setError(null);
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="user-phone" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold">
                          Phone Number *
                        </label>
                        <span className="text-[11px] text-gray-500 font-medium">10-digit mobile</span>
                      </div>
                      <div className="relative flex items-center rounded-xl border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-charcoal-900 focus-within:border-charcoal-900">
                        <span className="inline-flex items-center px-3.5 py-3.5 bg-gray-100 text-charcoal-800 font-semibold text-xs sm:text-sm select-none border-r border-gray-300">
                          +91
                        </span>
                        <input
                          id="user-phone"
                          type="tel"
                          inputMode="numeric"
                          required
                          disabled={loading}
                          placeholder="9876543210"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData({ ...formData, phone: digits });
                            if (error) setError(null);
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData('text');
                            let cleaned = pasted.replace(/\D/g, '');
                            if (cleaned.startsWith('91') && cleaned.length > 10) {
                              cleaned = cleaned.slice(2);
                            } else if (cleaned.startsWith('0') && cleaned.length > 10) {
                              cleaned = cleaned.slice(1);
                            }
                            cleaned = cleaned.slice(0, 10);
                            setFormData({ ...formData, phone: cleaned });
                            if (error) setError(null);
                          }}
                          className="w-full px-4 py-3.5 bg-white text-charcoal-900 text-xs sm:text-sm outline-none border-0 focus:ring-0 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="user-email" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                        Email Address
                      </label>
                      <input
                        id="user-email"
                        type="email"
                        disabled={loading}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="user-service" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                      Area of Interest
                    </label>
                    <select
                      id="user-service"
                      disabled={loading}
                      value={formData.areaOfInterest}
                      onChange={(e) => {
                        setFormData({ ...formData, areaOfInterest: e.target.value });
                        if (error) setError(null);
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring disabled:opacity-60"
                    >
                      <option value="">Select an area of interest</option>
                      {areaOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="user-message" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                      Project Details *
                    </label>
                    <textarea
                      id="user-message"
                      required
                      disabled={loading}
                      rows={4}
                      placeholder="Tell us about your project requirements..."
                      value={formData.projectDetails}
                      onChange={(e) => {
                        setFormData({ ...formData, projectDetails: e.target.value });
                        if (error) setError(null);
                      }}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring resize-none disabled:opacity-60"
                    />
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon
                    disabled={loading}
                    className="w-full justify-center"
                  >
                    {loading ? 'Submitting...' : (contact.ctaLabel || 'Request Consultation')}
                  </Button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}

'use client';

import { useState } from 'react';
import { useTemplateContent } from '@/components/providers/WebsiteContentProvider';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import { CheckCircle2 } from 'lucide-react';

export default function ContactSection() {
  const { contact, ourWork, tenantCategories, website } = useTemplateContent();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authoritative tenant categories (excluding navigation concept "All")
  const areaOptions = Array.isArray(tenantCategories) && tenantCategories.length > 0
    ? tenantCategories
    : (ourWork?.categories || []).filter((c) => c.toLowerCase() !== 'all');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    areaOfInterest: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
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
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email ? formData.email.trim() : null,
          areaOfInterest: formData.areaOfInterest || null,
          service: formData.areaOfInterest || null, // backward compatibility
          message: formData.message ? formData.message.trim() : null,
          domain: domain || undefined,
        }),
      });

      if (!res.ok) {
        let errMessage = "We couldn't send your enquiry right now. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) {
            errMessage = data.error;
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
        message: '',
      });
    } catch (err: any) {
      setError(err.message || "We couldn't send your enquiry right now. Please try again.");
    } finally {
      setLoading(false);
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
                    Thank you for contacting {brandName}. We have received your request and will get back to you shortly.
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
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="user-phone" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                        Phone Number *
                      </label>
                      <input
                        id="user-phone"
                        type="tel"
                        required
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring"
                      />
                    </div>

                    <div>
                      <label htmlFor="user-email" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                        Email Address
                      </label>
                      <input
                        id="user-email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="user-service" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                      Area of Interest
                    </label>
                    <select
                      id="user-service"
                      value={formData.areaOfInterest}
                      onChange={(e) => setFormData({ ...formData, areaOfInterest: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring"
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
                      Project Details
                    </label>
                    <textarea
                      id="user-message"
                      rows={4}
                      placeholder="Tell us about your project requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                      {error}
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
                    {loading ? 'Submitting...' : (contact.ctaLabel || 'Submit Request')}
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

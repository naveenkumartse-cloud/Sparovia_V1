'use client';

import { useState } from 'react';
import { siteConfig } from '@/config/siteConfig';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionHeading, BodyText } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { FadeIn } from '@/components/ui/Motion';
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Full Home Interior',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post(`/api/public/businesses/kvn-interiors/leads`, {
        fullName: formData.name,
        phone: formData.phone,
        email: formData.email,
        source: 'Website Contact Form',
        notes: `Service: ${formData.service}\nMessage: ${formData.message}`
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasContactInfo = Boolean(
    siteConfig.contact.phone ||
    siteConfig.contact.email ||
    siteConfig.contact.address ||
    siteConfig.contact.workingHours
  );

  return (
    <Section id="contact" background="white" padding="spacious">
      <Container>

        <div className={`grid grid-cols-1 ${hasContactInfo ? 'lg:grid-cols-12' : 'max-w-3xl mx-auto'} gap-12`}>

          {/* Contact Info Sidebar (Only rendered if client contact details exist in siteConfig) */}
          {hasContactInfo && (
            <div className="lg:col-span-5 flex flex-col justify-between">
              <FadeIn direction="right">
                <Eyebrow icon={false}>GET IN TOUCH</Eyebrow>

                <SectionHeading className="mb-6">
                  Let&apos;s Discuss Your Project
                </SectionHeading>

                <BodyText className="mb-8 font-normal">
                  Submit your inquiry below or reach out to our team directly. We look forward to transforming your residence.
                </BodyText>

                <div className="space-y-6">
                  {siteConfig.contact.phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 text-brand-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal-700 font-medium block">Phone</span>
                        <a href={`tel:${siteConfig.contact.phone}`} className="text-sm font-bold text-charcoal-900 hover:text-brand-600 focus-ring rounded">
                          {siteConfig.contact.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {siteConfig.contact.email && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 text-brand-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal-700 font-medium block">Email</span>
                        <a href={`mailto:${siteConfig.contact.email}`} className="text-sm font-bold text-charcoal-900 hover:text-brand-600 focus-ring rounded">
                          {siteConfig.contact.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {siteConfig.contact.address && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 text-brand-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal-700 font-medium block">Location</span>
                        <span className="text-sm font-bold text-charcoal-900">
                          {siteConfig.contact.address}
                        </span>
                      </div>
                    </div>
                  )}

                  {siteConfig.contact.workingHours && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 text-brand-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-charcoal-700 font-medium block">Working Hours</span>
                        <span className="text-sm font-bold text-charcoal-900">
                          {siteConfig.contact.workingHours}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>
            </div>
          )}

          {/* Form Card */}
          <div className={hasContactInfo ? 'lg:col-span-7' : 'w-full'}>
            <FadeIn direction="left" delay={0.1}>
              <div className="bg-surface p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-soft-sm">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center mx-auto mb-6 text-brand-600">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-sans text-2xl font-bold text-charcoal-900 mb-2">
                      Inquiry Received
                    </h3>
                    <p className="text-sm text-charcoal-600 font-normal mb-8 max-w-sm mx-auto">
                      Thank you for contacting KVN Interiors. We have received your request and will get back to you shortly.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="primary" size="md">
                      Send Another Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Eyebrow icon={false}>CONTACT</Eyebrow>

                    <h3 className="font-sans text-2xl sm:text-3xl font-bold text-charcoal-900 mb-6">
                      Request a Quote
                    </h3>

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
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="service-req" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                        Service Requirement
                      </label>
                      <select
                        id="service-req"
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring cursor-pointer"
                      >
                        <option value="Full Home Interior">Full Home Interior</option>
                        <option value="Modular Kitchens">Modular Kitchens</option>
                        <option value="Bespoke Wardrobes">Bespoke Wardrobes</option>
                        <option value="Living / TV Units">Living / TV Units</option>
                        <option value="uPVC Windows & Doors">uPVC Windows & Doors</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="project-msg" className="block text-xs uppercase tracking-wider text-charcoal-800 font-semibold mb-2">
                        Project Details / Message
                      </label>
                      <textarea
                        id="project-msg"
                        rows={4}
                        placeholder="Tell us about your property location, requirements, or scope..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-300 text-charcoal-900 text-xs sm:text-sm focus-ring"
                      ></textarea>
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full text-center mt-2" disabled={loading}>
                      {loading ? 'Sending Request...' : 'Request a Quote'}
                    </Button>
                    
                    {error && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                        {error}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </FadeIn>
          </div>

        </div>

      </Container>
    </Section>
  );
}

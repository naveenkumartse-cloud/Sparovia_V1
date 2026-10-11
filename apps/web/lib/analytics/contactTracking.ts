/**
 * Best-effort public contact activity tracking for outbound WhatsApp and Social clicks.
 * Does not block external navigation and never creates Leads.
 */
export function recordContactActivity(payload: {
  channel: 'WhatsApp' | 'Facebook' | 'Instagram';
  templateId?: string;
  templateTitle?: string;
  source?: string;
}) {
  try {
    const body = JSON.stringify({
      channel: payload.channel,
      eventType: 'ContactLinkClicked',
      templateId: payload.templateId,
      templateTitle: payload.templateTitle,
      source: payload.source || 'Website',
      correlationId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
    });

    let apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5043/api/v1';
    apiUrl = apiUrl.replace(/\/+$/, '');
    if (!apiUrl.endsWith('/api/v1')) {
      apiUrl = `${apiUrl}/api/v1`;
    }

    const endpoint = `${apiUrl}/contact-activity/public`;

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else if (typeof fetch !== 'undefined') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Best-effort: must never block or throw
  }
}

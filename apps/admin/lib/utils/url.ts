export interface ClientWebsiteUrlValidationResult {
  isValid: boolean;
  url: string | null;
  error?: string;
}

/**
 * Validates and normalizes client website URLs.
 * - Ensures scheme is absolute http or https
 * - Enforces HTTPS in production
 * - Rejects malformed or dangerous schemes (javascript:, data:, vbscript:)
 * - Never fabricates a URL or returns fallback Admin URL
 */
export function validateClientWebsiteUrl(rawUrl?: string | null): ClientWebsiteUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      url: null,
      error: 'Website URL is not configured yet.',
    };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      url: null,
      error: 'Website URL is not configured yet.',
    };
  }

  const lower = trimmed.toLowerCase();
  // Reject unsafe schemes explicitly
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('about:')
  ) {
    return {
      isValid: false,
      url: null,
      error: 'Invalid or unsafe website URL scheme.',
    };
  }

  // Prepend https:// if no scheme is provided
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        url: null,
        error: 'Website URL must use HTTP or HTTPS.',
      };
    }

    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.local');

    // In production, require HTTPS for public websites
    if (process.env.NODE_ENV === 'production' && parsed.protocol === 'http:' && !isLocalhost) {
      return {
        isValid: false,
        url: null,
        error: 'Website URL must use HTTPS in production.',
      };
    }

    if (!parsed.hostname || parsed.hostname.length < 3) {
      return {
        isValid: false,
        url: null,
        error: 'Invalid website domain.',
      };
    }

    return {
      isValid: true,
      url: parsed.toString(),
    };
  } catch {
    return {
      isValid: false,
      url: null,
      error: 'Malformed website URL.',
    };
  }
}

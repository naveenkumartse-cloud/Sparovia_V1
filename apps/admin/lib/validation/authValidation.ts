/**
 * Shared authentication & phone validation utilities for Sparovia Admin.
 * Enforces strict 10-digit Indian phone constraints and clean identifier detection.
 */

/**
 * Sanitizes phone input to digits only, strips common Indian country code prefixes (+91, 91, 0)
 * if pasted, and caps the length to exactly 10 digits.
 */
export function cleanPhoneInput(value: string): string {
  if (!value) return '';

  // Extract all digits
  let digits = value.replace(/\D/g, '');

  // If user pasted with 91 prefix (12 digits), strip the 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If user entered domestic trunk prefix '0' (11 digits), strip leading 0
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strictly maximum 10 digits
  return digits.slice(0, 10);
}

/**
 * Validates whether a phone number is a valid 10-digit Indian mobile number.
 * Indian mobile numbers must be exactly 10 digits and start with 6, 7, 8, or 9.
 */
export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = cleanPhoneInput(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  // Standard RFC-compliant email pattern
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

/**
 * Detects whether an identifier input is intended as a Phone Number or an Email.
 * - If the first character entered is a digit, it is treated as Phone Mode.
 * - Otherwise (letters, symbols, @), it is treated as Email Mode.
 */
export function detectIdentifierType(value: string): 'empty' | 'phone' | 'email' {
  const trimmed = value.trim();
  if (!trimmed) return 'empty';
  if (/^\d/.test(trimmed)) return 'phone';
  return 'email';
}

/**
 * Keyboard handler for phone-only inputs.
 * Blocks non-digit keys at input time while allowing essential navigation/control keys.
 */
export function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
  // Allow navigation and edit controls
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Tab' ||
    e.key === 'Escape' ||
    e.key === 'Enter' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Home' ||
    e.key === 'End'
  ) {
    return;
  }

  // Allow standard clipboard and selection keyboard shortcuts (Ctrl/Cmd + A, C, V, X, Z)
  if (e.ctrlKey || e.metaKey) {
    return;
  }

  // Disallow non-numeric characters (letters, spaces, punctuation)
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Clipboard paste handler for phone inputs.
 * Intercepts paste, strips invalid characters, and updates the field with sanitized 10 digits.
 */
export function handlePhonePaste(
  e: React.ClipboardEvent<HTMLInputElement>,
  onChange: (value: string) => void
): void {
  e.preventDefault();
  const pastedText = e.clipboardData.getData('text');
  const cleaned = cleanPhoneInput(pastedText);
  onChange(cleaned);
}

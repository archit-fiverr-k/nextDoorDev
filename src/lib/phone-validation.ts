/**
 * Validates mobile/phone numbers for NextDoorClinic.
 * Only UK numbers (+44 / 07...) are supported, with a single developer exception (+916296992939).
 */
export function isValidUKOrDevPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");

  // Developer Indian test number exception (+916296992939)
  if (
    cleaned === "+916296992939" ||
    digitsOnly === "916296992939" ||
    digitsOnly === "6296992939" ||
    digitsOnly === "06296992939"
  ) {
    return true;
  }

  // Reject any non-UK international country codes (e.g. +1, +33, +49, +91 other)
  if (cleaned.startsWith("+") && !cleaned.startsWith("+44")) {
    return false;
  }

  // Reject any Indian 91 prefixes that are not the developer exception number
  if (digitsOnly.startsWith("91") && digitsOnly !== "916296992939") {
    return false;
  }

  // Valid UK format: +44... or 07... or 01.../02.../03... (10 to 13 characters)
  const isUkFormat = /^(?:\+44|0)[1-9]\d{8,9}$/.test(cleaned);
  return isUkFormat;
}

export function getPhoneValidationError(phone: string): string | null {
  if (!phone || !phone.trim()) {
    return "Mobile number is required.";
  }

  if (isValidUKOrDevPhone(phone)) {
    return null;
  }

  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+") && !cleaned.startsWith("+44")) {
    return "Only UK mobile numbers (+44) are supported for this platform.";
  }

  return "Please enter a valid UK mobile number starting with 07 or +44.";
}

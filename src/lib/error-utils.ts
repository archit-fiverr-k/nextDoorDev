/**
 * NextDoorClinic - Centralized Error Formatting Utility
 * Converts internal error codes, BaseDomainError instances, and exceptions
 * into empathetic, professional patient-facing English messages.
 */

import { BaseDomainError } from "./errors";

const ERROR_DICTIONARY: Record<string, string> = {
  SLOT_TAKEN: "This time slot is no longer available. Please select another convenient time slot.",
  SLOT_CONFLICT:
    "This time slot is no longer available. Please select another convenient time slot.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a few moments before trying again.",
  INVALID_OTP: "The 6-digit verification code is incorrect. Please check your phone and try again.",
  EXPIRED_OTP: "The verification code has expired. Please request a new code.",
  UNAUTHORIZED: "Your session has expired or you do not have permission to perform this action.",
  TENANT_ACCESS_DENIED: "Unauthorized tenant access attempt.",
  FORBIDDEN: "Access denied. You do not have permission to access this resource.",
  PHARMACY_NOT_FOUND: "The requested healthcare clinic could not be found.",
  SERVICE_NOT_FOUND: "The selected treatment service is no longer available.",
  PATIENT_NOT_FOUND: "Patient record not found. Please check details and try again.",
  PAYMENT_FAILED: "Payment processing failed. Please verify your payment details and try again.",
  NETWORK_ERROR: "Unable to connect to healthcare servers. Please check your internet connection.",
  INVALID_PHONE: "Please enter a valid UK mobile number starting with 07 or +44.",
  INVALID_EMAIL: "Please enter a valid email address.",
  IDEMPOTENCY_CONFLICT: "A booking request with this reference is already being processed.",
};

export function formatErrorMessage(error: any): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  // Handle BaseDomainError instances
  if (error instanceof BaseDomainError) {
    return error.message;
  }

  // Handle String Error Code or Message
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (ERROR_DICTIONARY[trimmed]) {
      return ERROR_DICTIONARY[trimmed];
    }
    for (const [code, userMsg] of Object.entries(ERROR_DICTIONARY)) {
      if (trimmed.toLowerCase().includes(code.toLowerCase())) {
        return userMsg;
      }
    }
    return trimmed;
  }

  // Handle standard Error Instance
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (ERROR_DICTIONARY[msg]) {
      return ERROR_DICTIONARY[msg];
    }
    for (const [code, userMsg] of Object.entries(ERROR_DICTIONARY)) {
      if (msg.toLowerCase().includes(code.toLowerCase())) {
        return userMsg;
      }
    }
    return msg;
  }

  // Handle Action Object ({ error: "..." })
  if (typeof error === "object" && error !== null) {
    if (typeof error.error === "string") {
      return formatErrorMessage(error.error);
    }
    if (typeof error.message === "string") {
      return formatErrorMessage(error.message);
    }
  }

  return "An unexpected error occurred. Please try again or contact support if the issue persists.";
}

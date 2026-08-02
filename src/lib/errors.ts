/**
 * NextDoorClinic — Structured Domain Error Taxonomy
 * Extends BaseDomainError to provide typed, structured error classes
 * across Server Actions, API routes, and Client UI error boundaries.
 */

export abstract class BaseDomainError extends Error {
  public abstract readonly errorCode: string;
  public abstract readonly statusCode: number;
  public readonly isOperational: boolean = true;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SlotConflictError extends BaseDomainError {
  public readonly errorCode = "SLOT_CONFLICT";
  public readonly statusCode = 409;

  constructor(message = "This time slot is no longer available. Please select another time slot.") {
    super(message);
  }
}

export class TenantAccessError extends BaseDomainError {
  public readonly errorCode = "TENANT_ACCESS_DENIED";
  public readonly statusCode = 403;

  constructor(message = "Unauthorized tenant access attempt.") {
    super(message);
  }
}

export class ValidationError extends BaseDomainError {
  public readonly errorCode = "VALIDATION_ERROR";
  public readonly statusCode = 400;

  constructor(message = "Invalid input payload.") {
    super(message);
  }
}

export class RateLimitError extends BaseDomainError {
  public readonly errorCode = "RATE_LIMIT_EXCEEDED";
  public readonly statusCode = 429;

  constructor(message = "Too many requests. Please wait a few moments before trying again.") {
    super(message);
  }
}

export class OtpVerificationError extends BaseDomainError {
  public readonly errorCode = "INVALID_OTP";
  public readonly statusCode = 400;

  constructor(message = "The verification code entered is incorrect or expired.") {
    super(message);
  }
}

export class NotFoundError extends BaseDomainError {
  public readonly errorCode = "NOT_FOUND";
  public readonly statusCode = 404;

  constructor(message = "The requested resource was not found.") {
    super(message);
  }
}

export class IdempotencyConflictError extends BaseDomainError {
  public readonly errorCode = "IDEMPOTENCY_CONFLICT";
  public readonly statusCode = 409;

  constructor(message = "A booking request with this idempotency key is already being processed.") {
    super(message);
  }
}

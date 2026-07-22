"use server";

import { db } from "@/lib/db";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";

export async function setupMfaAction(params: {
  userId?: string;
  customerId?: string;
  accountName: string;
}) {
  try {
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "NextDoorClinic",
      label: params.accountName,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    const uri = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(uri);

    // Store or update unverified MFA secret
    if (params.userId) {
      await db.userMfa.upsert({
        where: { userId_type: { userId: params.userId, type: "TOTP" } },
        update: { secret: secret.base32, isEnabled: false },
        create: { userId: params.userId, secret: secret.base32, isEnabled: false },
      });
    } else if (params.customerId) {
      await db.userMfa.upsert({
        where: { customerId_type: { customerId: params.customerId, type: "TOTP" } },
        update: { secret: secret.base32, isEnabled: false },
        create: { customerId: params.customerId, secret: secret.base32, isEnabled: false },
      });
    } else {
      return { success: false, error: "User ID or Customer ID is required" };
    }

    return {
      success: true,
      qrCodeDataUrl,
      secretBase32: secret.base32,
    };
  } catch (error: any) {
    console.error("❌ setupMfaAction error:", error);
    return { success: false, error: "Failed to setup MFA authenticator" };
  }
}

export async function enableMfaAction(params: {
  userId?: string;
  customerId?: string;
  code: string;
}) {
  try {
    const record = await db.userMfa.findFirst({
      where: params.userId
        ? { userId: params.userId, type: "TOTP" }
        : { customerId: params.customerId, type: "TOTP" },
    });

    if (!record) {
      return { success: false, error: "MFA setup record not found. Please scan QR code again." };
    }

    const totp = new OTPAuth.TOTP({
      issuer: "NextDoorClinic",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(record.secret),
    });

    const delta = totp.validate({ token: params.code.trim(), window: 1 });
    if (delta === null) {
      return {
        success: false,
        error: "Invalid authenticator code. Check your device clock and try again.",
      };
    }

    // Generate 8 backup recovery codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    await db.userMfa.update({
      where: { id: record.id },
      data: {
        isEnabled: true,
        backupCodes,
      },
    });

    return {
      success: true,
      backupCodes,
    };
  } catch (error: any) {
    console.error("❌ enableMfaAction error:", error);
    return { success: false, error: "Failed to verify and enable MFA" };
  }
}

export async function verifyMfaCodeAction(params: {
  userId?: string;
  customerId?: string;
  code: string;
}) {
  try {
    const record = await db.userMfa.findFirst({
      where: params.userId
        ? { userId: params.userId, type: "TOTP", isEnabled: true }
        : { customerId: params.customerId, type: "TOTP", isEnabled: true },
    });

    if (!record) {
      return { success: true, mfaRequired: false }; // No MFA configured
    }

    const cleanCode = params.code.trim().toUpperCase();

    // Check backup recovery codes
    if (record.backupCodes.includes(cleanCode)) {
      // Remove used backup code
      const updatedCodes = record.backupCodes.filter((c) => c !== cleanCode);
      await db.userMfa.update({
        where: { id: record.id },
        data: { backupCodes: updatedCodes },
      });
      return { success: true, mfaRequired: true, usedBackupCode: true };
    }

    // Verify TOTP token
    const totp = new OTPAuth.TOTP({
      issuer: "NextDoorClinic",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(record.secret),
    });

    const delta = totp.validate({ token: cleanCode, window: 1 });
    if (delta === null) {
      return {
        success: false,
        error: "Invalid 6-digit authenticator code or backup recovery code",
      };
    }

    return { success: true, mfaRequired: true };
  } catch (error: any) {
    console.error("❌ verifyMfaCodeAction error:", error);
    return { success: false, error: "Failed to verify security code" };
  }
}

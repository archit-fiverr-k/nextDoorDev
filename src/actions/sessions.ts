"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createSessionRecordAction(data: {
  userId?: string;
  customerId?: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await db.userSession.create({
      data: {
        userId: data.userId || null,
        customerId: data.customerId || null,
        sessionToken: data.sessionToken,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        expiresAt,
      },
    });

    // Log security login event
    await db.securityLog.create({
      data: {
        userId: data.userId || null,
        customerId: data.customerId || null,
        eventType: "LOGIN_SUCCESS",
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });

    return { success: true, data: session };
  } catch (error: any) {
    console.error("❌ createSessionRecordAction error:", error);
    return { success: false, error: "Failed to log session" };
  }
}

export async function getUserSessionsAction(params: { userId?: string; customerId?: string }) {
  try {
    const sessions = await db.userSession.findMany({
      where: {
        ...(params.userId ? { userId: params.userId } : { customerId: params.customerId }),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress || "Unknown IP",
        userAgent: s.userAgent || "Browser Session",
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("❌ getUserSessionsAction error:", error);
    return { success: false, error: "Failed to fetch active sessions" };
  }
}

export async function revokeSessionAction(sessionId: string) {
  try {
    await db.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ revokeSessionAction error:", error);
    return { success: false, error: "Failed to revoke session" };
  }
}

export async function revokeAllOtherSessionsAction(params: {
  currentSessionToken: string;
  userId?: string;
  customerId?: string;
}) {
  try {
    await db.userSession.updateMany({
      where: {
        ...(params.userId ? { userId: params.userId } : { customerId: params.customerId }),
        sessionToken: { not: params.currentSessionToken },
      },
      data: { isRevoked: true },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ revokeAllOtherSessionsAction error:", error);
    return { success: false, error: "Failed to revoke active sessions" };
  }
}

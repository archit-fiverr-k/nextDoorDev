"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function uploadMediaAssetAction(data: {
  pharmacyId?: string;
  customerId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category?: string;
}) {
  try {
    const asset = await db.mediaAsset.create({
      data: {
        pharmacyId: data.pharmacyId || null,
        customerId: data.customerId || null,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        category: data.category || "GENERAL",
      },
    });

    return { success: true, data: asset };
  } catch (error: any) {
    console.error("❌ uploadMediaAssetAction error:", error);
    return { success: false, error: "Failed to save media asset record" };
  }
}

export async function getPharmacyMediaAssetsAction(pharmacyId: string, category?: string) {
  try {
    const assets = await db.mediaAsset.findMany({
      where: {
        pharmacyId,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      assets: assets.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        category: a.category,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("❌ getPharmacyMediaAssetsAction error:", error);
    return { success: false, error: "Failed to fetch media assets" };
  }
}

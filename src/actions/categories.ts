"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { uploadLogo } from "@/lib/r2";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export async function getCategoriesAction(type: string = "SERVICE") {
  try {
    const categories = await db.category.findMany({
      where: {
        type,
        deleted: false,
      },
      orderBy: { displayOrder: "asc" },
    });
    return { success: true, categories };
  } catch (error: any) {
    console.error("❌ getCategoriesAction error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function createCategoryActionForm(formData: FormData) {
  const session = await getRequiredSession();
  if (
    session.user.role !== "super_admin" &&
    session.user.role !== "platform_admin" &&
    session.user.role !== "pharmacy"
  ) {
    return { success: false, error: "Unauthorized access" };
  }

  const name = formData.get("name") as string;
  const type = (formData.get("type") as string) || "SERVICE";
  const description = (formData.get("description") as string) || null;
  const color = (formData.get("color") as string) || "#10B981";
  const displayOrder = Number(formData.get("displayOrder") || "0");
  const rawSlug = formData.get("slug") as string;
  const slug = rawSlug ? slugify(rawSlug) : slugify(name);

  if (!name) {
    return { success: false, error: "Category name is required" };
  }

  try {
    const imageFile = formData.get("imageFile") as File | null;
    let imageUrl = (formData.get("imageUrl") as string) || null;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 2 * 1024 * 1024) {
        return { success: false, error: "Image size must be smaller than 2MB" };
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadId = session.user.pharmacyId || "platform";
      imageUrl = await uploadLogo(uploadId, buffer, imageFile.name, imageFile.type);
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        type,
        description,
        color,
        displayOrder,
        imageUrl,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/book/[pharmacySlug]");
    return { success: true, category };
  } catch (error: any) {
    console.error("❌ createCategoryActionForm error:", error);
    return { success: false, error: error.message || "Failed to create category" };
  }
}

export async function updateCategoryActionForm(categoryId: string, formData: FormData) {
  const session = await getRequiredSession();
  if (
    session.user.role !== "super_admin" &&
    session.user.role !== "platform_admin" &&
    session.user.role !== "pharmacy"
  ) {
    return { success: false, error: "Unauthorized access" };
  }

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const color = (formData.get("color") as string) || "#10B981";
  const displayOrder = Number(formData.get("displayOrder") || "0");

  try {
    const existing = await db.category.findUnique({ where: { id: categoryId } });
    if (!existing) return { success: false, error: "Category not found" };

    const imageFile = formData.get("imageFile") as File | null;
    let imageUrl = existing.imageUrl;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 2 * 1024 * 1024) {
        return { success: false, error: "Image size must be smaller than 2MB" };
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadId = session.user.pharmacyId || "platform";
      imageUrl = await uploadLogo(uploadId, buffer, imageFile.name, imageFile.type);
    } else if (formData.has("imageUrl")) {
      imageUrl = (formData.get("imageUrl") as string) || null;
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        name: name || existing.name,
        description,
        color,
        displayOrder,
        imageUrl,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/book/[pharmacySlug]");
    return { success: true, category };
  } catch (error: any) {
    console.error("❌ updateCategoryActionForm error:", error);
    return { success: false, error: error.message || "Failed to update category" };
  }
}

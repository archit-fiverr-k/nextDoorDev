"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createReviewAction(data: {
  appointmentId: string;
  rating: number;
  title?: string;
  content: string;
  isAnonymous?: boolean;
}) {
  try {
    if (!data.appointmentId || !data.content) {
      return { success: false, error: "Appointment ID and content are required" };
    }

    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5 stars" };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { review: true },
    });

    if (!appointment) {
      return { success: false, error: "Appointment record not found" };
    }

    if (appointment.review) {
      return { success: false, error: "A review has already been submitted for this appointment" };
    }

    const review = await db.review.create({
      data: {
        pharmacyId: appointment.pharmacyId,
        serviceId: appointment.serviceId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        rating: Math.round(data.rating),
        title: data.title || null,
        content: data.content.trim(),
        isAnonymous: !!data.isAnonymous,
        status: "APPROVED",
      },
    });

    // Update aggregate daily analytics for pharmacy
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    const agg = await db.review.aggregate({
      where: { pharmacyId: appointment.pharmacyId, status: "APPROVED" },
      _avg: { rating: true },
    });

    const newAvg = agg._avg.rating || 5.0;

    await db.dailyAnalytics.upsert({
      where: {
        pharmacyId_date: {
          pharmacyId: appointment.pharmacyId,
          date: todayDate,
        },
      },
      update: { averageRating: newAvg },
      create: {
        pharmacyId: appointment.pharmacyId,
        date: todayDate,
        averageRating: newAvg,
      },
    });

    revalidatePath(`/`);
    return { success: true, data: review };
  } catch (error: any) {
    console.error("❌ createReviewAction error:", error);
    return { success: false, error: error.message || "Failed to submit review" };
  }
}

export async function getPharmacyReviewsAction(pharmacyId: string, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;

    const [reviews, totalCount, agg, ratingCounts] = await Promise.all([
      db.review.findMany({
        where: { pharmacyId, status: "APPROVED" },
        include: {
          customer: {
            select: { firstName: true, lastName: true },
          },
          service: {
            select: { name: true },
          },
          replies: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where: { pharmacyId, status: "APPROVED" } }),
      db.review.aggregate({
        where: { pharmacyId, status: "APPROVED" },
        _avg: { rating: true },
      }),
      db.review.groupBy({
        by: ["rating"],
        where: { pharmacyId, status: "APPROVED" },
        _count: { rating: true },
      }),
    ]);

    const averageRating = Number((agg._avg.rating || 5.0).toFixed(1));

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingCounts.forEach((r) => {
      distribution[r.rating] = r._count.rating;
    });

    return {
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        authorName: r.isAnonymous
          ? "Verified Patient"
          : `${r.customer.firstName} ${r.customer.lastName[0]}.`,
        serviceName: r.service?.name || "Clinical Service",
        createdAt: r.createdAt.toISOString(),
        replies: r.replies.map((reply) => ({
          id: reply.id,
          replyText: reply.replyText,
          createdAt: reply.createdAt.toISOString(),
        })),
      })),
      totalCount,
      averageRating,
      distribution,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (error: any) {
    console.error("❌ getPharmacyReviewsAction error:", error);
    return { success: false, error: "Failed to fetch reviews" };
  }
}

export async function replyToReviewAction(data: {
  reviewId: string;
  replyText: string;
  pharmacyId: string;
}) {
  try {
    if (!data.reviewId || !data.replyText.trim()) {
      return { success: false, error: "Reply text is required" };
    }

    const reply = await db.reviewReply.create({
      data: {
        reviewId: data.reviewId,
        pharmacyId: data.pharmacyId,
        replyText: data.replyText.trim(),
      },
    });

    revalidatePath(`/admin/reviews`);
    return { success: true, data: reply };
  } catch (error: any) {
    console.error("❌ replyToReviewAction error:", error);
    return { success: false, error: "Failed to add reply" };
  }
}

export async function reportReviewAction(reviewId: string, reason: string) {
  try {
    const report = await db.reviewReport.create({
      data: {
        reviewId,
        reason,
        status: "PENDING",
      },
    });
    return { success: true, data: report };
  } catch (error: any) {
    console.error("❌ reportReviewAction error:", error);
    return { success: false, error: "Failed to submit report" };
  }
}

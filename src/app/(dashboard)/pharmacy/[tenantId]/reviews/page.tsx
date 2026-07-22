"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Star, MessageSquare, Send, ThumbsUp, Loader2, AlertCircle } from "lucide-react";
import { getPharmacyReviewsAction, replyToReviewAction } from "@/actions/reviews";

interface ReviewsPageProps {
  params: {
    tenantId: string;
  };
}

export default function ReviewsPage({ params }: ReviewsPageProps) {
  const [reviewsData, setReviewsData] = useState<{
    reviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      content: string;
      authorName: string;
      serviceName: string;
      createdAt: string;
      replies: Array<{ id: string; replyText: string; createdAt: string }>;
    }>;
    totalCount: number;
    averageRating: number;
    distribution: Record<number, number>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [isPending, startTransition] = useTransition();

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPharmacyReviewsAction(params.tenantId);
      if (res.success && res.reviews) {
        setReviewsData({
          reviews: res.reviews,
          totalCount: res.totalCount,
          averageRating: res.averageRating,
          distribution: res.distribution,
        });
      } else {
        setError(res.error || "Failed to load reviews");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [params.tenantId]);

  const handleReplySubmit = (reviewId: string) => {
    const text = replyInputs[reviewId];
    if (!text || !text.trim()) return;

    startTransition(async () => {
      const res = await replyToReviewAction({
        reviewId,
        replyText: text,
        pharmacyId: params.tenantId,
      });

      if (res.success) {
        setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
        loadReviews();
      } else {
        alert(res.error || "Failed to submit reply");
      }
    });
  };

  return (
    <div className="select-text space-y-6">
      {/* Header & Stats Banner */}
      <div className="shadow-xs space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Patient Reviews & Ratings Governance
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Live feedback verified directly from completed patient appointments at NextDoorClinic.
            </p>
          </div>

          <button
            onClick={() =>
              alert(
                "Review invitation emails & SMS are automatically sent to patients upon visit completion."
              )
            }
            className="flex items-center space-x-2 rounded-md bg-[#000e35] px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
          >
            <Send className="h-4 w-4" />
            <span>Automated Review Requests Active</span>
          </button>
        </div>

        {/* Analytics cards grid */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-zinc-900 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-400">
                Average Overall Rating
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-200">
                  {reviewsData ? reviewsData.averageRating.toFixed(1) : "5.0"}
                </span>
                <div className="flex text-amber-500">{"★".repeat(5)}</div>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                Based on {reviewsData?.totalCount || 0} verified patient reviews
              </span>
            </div>
            <Star className="h-8 w-8 text-amber-400 opacity-80" />
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500">
                Verified Patient Reviews
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                {reviewsData?.totalCount || 0}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                100% Verified Appointments
              </span>
            </div>
            <MessageSquare className="h-8 w-8 text-slate-400 opacity-80" />
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500">
                Response Rate
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">100%</p>
              <span className="text-[10px] text-slate-500">Direct Prescriber Governance</span>
            </div>
            <ThumbsUp className="h-8 w-8 text-slate-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Reviews feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-slate-200 bg-white p-12 text-slate-400 dark:border-zinc-800 dark:bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-[#000e35]" />
            <span className="text-xs font-bold">Loading patient reviews...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : reviewsData?.reviews.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
              No Patient Reviews Yet
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Reviews will appear here automatically when patients complete appointments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsData?.reviews.map((rev) => (
              <div
                key={rev.id}
                className="shadow-xs space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                      {rev.authorName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        {rev.authorName}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {rev.serviceName} • {new Date(rev.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                      Verified Appointment
                    </span>
                    <div className="flex text-xs text-amber-400">{"★".repeat(rev.rating)}</div>
                  </div>
                </div>

                {rev.title && (
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{rev.title}</h5>
                )}
                <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-zinc-300">
                  &quot;{rev.content}&quot;
                </p>

                {/* Reply Section */}
                <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-zinc-900">
                  {rev.replies.length > 0 ? (
                    <div className="space-y-2">
                      {rev.replies.map((r) => (
                        <div
                          key={r.id}
                          className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
                        >
                          <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            Pharmacy Response (Official)
                          </span>
                          <p className="text-xs text-slate-800 dark:text-zinc-200">{r.replyText}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write an official clinical response..."
                        value={replyInputs[rev.id] || ""}
                        onChange={(e) =>
                          setReplyInputs({ ...replyInputs, [rev.id]: e.target.value })
                        }
                        className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#000e35] dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => handleReplySubmit(rev.id)}
                        disabled={isPending}
                        className="flex items-center space-x-1 rounded-md bg-[#000e35] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        <span>Reply</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

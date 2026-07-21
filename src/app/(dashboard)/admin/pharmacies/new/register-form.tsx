"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPharmacySchema, CreatePharmacyInput } from "@/schemas/admin";
import { createPharmacyByAdminAction } from "@/actions/admin";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Mail, Globe, Phone, MapPin, Key } from "lucide-react";
import Link from "next/link";

export function RegisterPharmacyForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePharmacyInput>({
    resolver: zodResolver(createPharmacySchema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    },
  });

  const onSubmit = (data: CreatePharmacyInput) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await createPharmacyByAdminAction(data);
      if (!res.success) {
        setError(res.error || "An error occurred during registration");
      } else {
        setSuccess(true);
        reset();
      }
    });
  };

  return (
    <div className="shadow-premium max-w-2xl overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex items-center space-x-3 border-b border-slate-100 p-6 dark:border-zinc-900/60">
        <Link
          href="/admin/pharmacies"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New Pharmacy</h3>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            Pharmacy registered successfully! The status is set to PENDING verification.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Pharmacy Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Pharmacy Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Store className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. MedCare Pharmacy"
                  {...register("name")}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </div>

            {/* Slug / Domain */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Subdomain / Slug
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Globe className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. med-care"
                  {...register("slug")}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="manager@pharmacy.com"
                  {...register("email")}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 555-0199"
                  {...register("phone")}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Physical Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-start pl-3 pt-3 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <textarea
                  placeholder="Street Address, City, State, ZIP"
                  rows={2}
                  {...register("address")}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>
              )}
            </div>

            {/* Temporary Password */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Temporary Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-slate-50 pt-4 dark:border-zinc-900/40">
            <Link
              href="/admin/pharmacies"
              className="dark:text-slate-350 dark:hover:bg-zinc-850 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              Cancel
            </Link>
            <Button type="submit" isLoading={isPending}>
              Register Pharmacy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

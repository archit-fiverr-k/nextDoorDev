"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  Save,
  Check,
  CheckSquare,
  Square,
  Stethoscope,
  Filter,
  X,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  updatePharmacyServiceStatusAction,
  bulkSavePharmacyServicesAction,
  PharmacyMasterServiceInput,
} from "@/actions/pharmacy-services";

interface MasterServiceItem {
  id: string;
  name: string;
  slug: string;
  serviceType: "NHS" | "PRIVATE" | string;
  defaultPrice: number | string;
  priceLocked: boolean;
  shortDescription?: string | null;
  description?: string | null;
  categoryId: string;
}

interface ServiceCategoryItem {
  id: string;
  name: string;
  slug: string;
  masterServices: MasterServiceItem[];
}

interface PharmacyServiceRecord {
  id: string;
  masterServiceId: string;
  enabled: boolean;
  priceOverride: number | string | null;
  internalNotes: string | null;
}

interface PharmacyServicesCatalogueViewProps {
  tenantIdOrSlug: string;
  pharmacyId: string;
  pharmacyName: string;
  categories: ServiceCategoryItem[];
  pharmacyServices: PharmacyServiceRecord[];
}

interface ServiceRowState {
  enabled: boolean;
  price: string;
  doseCourse: string;
}

export function PharmacyServicesCatalogueView({
  tenantIdOrSlug,
  pharmacyId,
  pharmacyName,
  categories,
  pharmacyServices,
}: PharmacyServicesCatalogueViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Map of masterServiceId -> PharmacyServiceRecord
  const psMap = useMemo(() => {
    const map = new Map<string, PharmacyServiceRecord>();
    pharmacyServices.forEach((ps) => {
      map.set(ps.masterServiceId, ps);
    });
    return map;
  }, [pharmacyServices]);

  // Flatten all master services
  const allMasterServices = useMemo(() => {
    const list: (MasterServiceItem & { categoryName: string })[] = [];
    categories.forEach((cat) => {
      cat.masterServices.forEach((ms) => {
        list.push({ ...ms, categoryName: cat.name });
      });
    });
    return list;
  }, [categories]);

  // Build row states helper
  const buildInitialStates = useMemo(() => {
    const initial: Record<string, ServiceRowState> = {};
    categories.forEach((cat) => {
      cat.masterServices.forEach((ms) => {
        const ps = psMap.get(ms.id);
        const defaultDose =
          ps?.internalNotes ||
          (ms.name.toLowerCase().includes("vaccine") &&
          !ms.name.toLowerCase().includes("flu") &&
          !ms.name.toLowerCase().includes("covid")
            ? "3"
            : "1");

        const initialPrice =
          ms.serviceType === "NHS"
            ? "0"
            : ps?.priceOverride !== null && ps?.priceOverride !== undefined
              ? String(ps.priceOverride)
              : String(ms.defaultPrice);

        initial[ms.id] = {
          enabled: ps ? ps.enabled : false, // Default unselected for easy setup
          price: initialPrice,
          doseCourse: defaultDose,
        };
      });
    });
    return initial;
  }, [categories, psMap]);

  // State map (masterServiceId -> ServiceRowState)
  const [rowStates, setRowStates] = useState<Record<string, ServiceRowState>>(buildInitialStates);

  // Sync state when props update
  useEffect(() => {
    setRowStates(buildInitialStates);
  }, [buildInitialStates]);

  // Calculate summary metrics
  const totalServicesCount = allMasterServices.length;
  const enabledCount = Object.values(rowStates).filter((s) => s.enabled).length;
  const nhsEnabledCount = allMasterServices.filter(
    (ms) => ms.serviceType === "NHS" && rowStates[ms.id]?.enabled
  ).length;
  const privateEnabledCount = enabledCount - nhsEnabledCount;

  // Filter master services by Category and Search Query
  const filteredServices = useMemo(() => {
    return allMasterServices.filter((ms) => {
      const matchesCategory = selectedCategory === "all" || ms.categoryId === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        ms.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ms.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [allMasterServices, selectedCategory, searchQuery]);

  // Handle Checkbox Toggle
  const handleToggleEnable = (masterServiceId: string) => {
    setIsSaved(false);
    setRowStates((prev) => {
      const current = prev[masterServiceId] || { enabled: false, price: "0", doseCourse: "1" };
      return {
        ...prev,
        [masterServiceId]: {
          ...current,
          enabled: !current.enabled,
        },
      };
    });
  };

  // Handle Input Changes
  const handlePriceChange = (masterServiceId: string, value: string) => {
    setIsSaved(false);
    setRowStates((prev) => {
      const current = prev[masterServiceId] || { enabled: false, price: "0", doseCourse: "1" };
      return {
        ...prev,
        [masterServiceId]: {
          ...current,
          price: value,
        },
      };
    });
  };

  const handleDoseChange = (masterServiceId: string, value: string) => {
    setIsSaved(false);
    setRowStates((prev) => {
      const current = prev[masterServiceId] || { enabled: false, price: "0", doseCourse: "1" };
      return {
        ...prev,
        [masterServiceId]: {
          ...current,
          doseCourse: value,
        },
      };
    });
  };

  // Bulk Save Handler
  const handleSaveAll = () => {
    setStatusMessage(null);
    const payload: PharmacyMasterServiceInput[] = allMasterServices.map((ms) => {
      const state = rowStates[ms.id] || { enabled: false, price: "0", doseCourse: "1" };
      return {
        masterServiceId: ms.id,
        enabled: state.enabled,
        priceOverride: ms.serviceType === "NHS" ? 0 : parseFloat(state.price) || 0,
        doseCourse: state.doseCourse,
      };
    });

    startTransition(async () => {
      const res = await bulkSavePharmacyServicesAction(tenantIdOrSlug, payload);
      if (res.success) {
        setIsSaved(true);
        setStatusMessage({
          type: "success",
          text: `Saved successfully! ${enabledCount} services are active for patient booking.`,
        });
        router.refresh();
        setTimeout(() => setIsSaved(false), 4000);
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "An error occurred while saving configurations.",
        });
      }
    });
  };

  // Quick category bulk select/deselect
  const handleBulkCategoryToggle = (enable: boolean) => {
    setIsSaved(false);
    setRowStates((prev) => {
      const updated = { ...prev };
      filteredServices.forEach((ms) => {
        if (updated[ms.id]) {
          updated[ms.id] = { ...updated[ms.id], enabled: enable };
        }
      });
      return updated;
    });
  };

  return (
    <div className="select-text space-y-6 pb-16 font-sans text-slate-900 antialiased dark:text-zinc-100">
      {/* ========================================================================= */}
      {/* ENTERPRISE PAGE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              Service Offerings & Pricing Catalogue
            </h1>
            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Branch Portal
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Configure offered clinical services for{" "}
            <strong className="font-semibold text-slate-800 dark:text-zinc-200">
              {pharmacyName}
            </strong>
            , adjust dosage structures, and manage custom patient pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            disabled={isPending}
            className={`shadow-xs inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 ${
              isSaved
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900"
            }`}
          >
            {isSaved ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            <span>
              {isPending
                ? "Saving..."
                : isSaved
                  ? "Saved Successfully!"
                  : `Save Changes (${enabledCount} Selected)`}
            </span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-md border p-3.5 text-xs font-medium ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* METRICS STRIP */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="shadow-2xs rounded-md border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Catalogue Services
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {totalServicesCount}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Across {categories.length} categories
          </div>
        </div>

        <div className="shadow-2xs rounded-md border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Selected Services
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {enabledCount}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">Active for patient booking</div>
        </div>

        <div className="shadow-2xs rounded-md border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            NHS Free Services
          </div>
          <div className="mt-1 text-2xl font-bold text-teal-700 dark:text-teal-400">
            {nhsEnabledCount}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">Locked @ £0.00</div>
        </div>

        <div className="shadow-2xs rounded-md border border-slate-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Private Services
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {privateEnabledCount}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">Custom pricing enabled</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY TAB STRIP */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Category Navigation Bar */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              selectedCategory === "all"
                ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            All Services ({enabledCount}/{allMasterServices.length})
          </button>

          {categories.map((cat) => {
            const catSelectedCount = cat.masterServices.filter(
              (ms) => rowStates[ms.id]?.enabled
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {cat.name} ({catSelectedCount}/{cat.masterServices.length})
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name..."
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkCategoryToggle(true)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Select All Filtered
            </button>
            <button
              onClick={() => handleBulkCategoryToggle(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Deselect All Filtered
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL DATA TABLE */}
      {/* ========================================================================= */}
      <div className="shadow-2xs rounded-md border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="w-12 px-3.5 py-3 text-center">Offer</th>
                <th className="px-4 py-3">Service Name</th>
                <th className="w-24 px-3.5 py-3">Type</th>
                <th className="w-36 px-3.5 py-3">Dose / Course *</th>
                <th className="w-40 px-3.5 py-3">Price / Dose (£) *</th>
                <th className="w-36 px-3.5 py-3">Category</th>
                <th className="w-24 px-3.5 py-3 text-right">Status</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                    No services found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredServices.map((ms) => {
                  const state = rowStates[ms.id] || {
                    enabled: false,
                    price: String(ms.defaultPrice),
                    doseCourse: "1",
                  };
                  const isNhs = ms.serviceType === "NHS";

                  return (
                    <tr
                      key={ms.id}
                      className={`transition-colors ${
                        state.enabled
                          ? "bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                          : "bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      {/* 1. Checkbox Enable Toggle */}
                      <td className="px-3.5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={state.enabled}
                          onChange={() => handleToggleEnable(ms.id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </td>

                      {/* 2. Service Name */}
                      <td className="px-4 py-3">
                        <div
                          onClick={() => handleToggleEnable(ms.id)}
                          className="cursor-pointer font-semibold text-slate-900 hover:text-emerald-700 dark:text-white"
                        >
                          {ms.name}
                        </div>
                        {ms.shortDescription && (
                          <div className="mt-0.5 max-w-sm truncate text-[11px] text-slate-400">
                            {ms.shortDescription}
                          </div>
                        )}
                      </td>

                      {/* 3. NHS / Private Badge */}
                      <td className="px-3.5 py-3">
                        {isNhs ? (
                          <span className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300">
                            <ShieldCheck className="h-3 w-3 text-teal-600" /> NHS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Private
                          </span>
                        )}
                      </td>

                      {/* 4. Dose / Course * Input */}
                      <td className="px-3.5 py-3">
                        <input
                          type="text"
                          value={state.doseCourse}
                          disabled={!state.enabled}
                          onChange={(e) => handleDoseChange(ms.id, e.target.value)}
                          placeholder="e.g. 1, 3"
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50 disabled:text-slate-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                        />
                      </td>

                      {/* 5. Price / Dose (£) * Input */}
                      <td className="px-3.5 py-3">
                        {isNhs ? (
                          <div className="flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-950">
                            Free (£0.00)
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2.5 top-1 text-xs text-slate-400">
                              £
                            </span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={state.price}
                              disabled={!state.enabled}
                              onChange={(e) => handlePriceChange(ms.id, e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded-md border border-slate-300 bg-white py-1 pl-6 pr-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50 disabled:text-slate-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                            />
                          </div>
                        )}
                      </td>

                      {/* 6. Category Tag */}
                      <td className="px-3.5 py-3">
                        <span className="inline-block rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {ms.categoryName}
                        </span>
                      </td>

                      {/* 7. Status */}
                      <td className="px-3.5 py-3 text-right">
                        {state.enabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
                            Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

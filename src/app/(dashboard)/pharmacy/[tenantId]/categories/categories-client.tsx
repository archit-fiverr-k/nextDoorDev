"use client";

import React, { useState } from "react";
import {
  Grid,
  Plus,
  Layers,
  CheckCircle2,
  Sparkles,
  Globe,
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  Edit,
  Tag,
} from "lucide-react";

interface CategoriesClientProps {
  pharmacyId: string;
  initialCategories: any[];
}

export default function CategoriesClient({ pharmacyId, initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [showDrawer, setShowDrawer] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    isFeatured: true,
    displayOrder: categories.length + 1,
    seoTitle: "",
    seoDescription: "",
  });

  const toggleFeatured = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFeatured: !c.isFeatured } : c))
    );
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Category Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Organize pharmacy clinical services into consumer-friendly categories with custom
            display order & SEO landing pages.
          </p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Category Cards / Grid view */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className="relative space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-sm font-bold text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-300">
                  <Grid className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                    /{cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>
              </div>

              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">
                Order #{cat.displayOrder || idx + 1}
              </span>
            </div>

            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              {cat.description || "Healthcare and pharmacy clinical treatments."}
            </p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-zinc-900">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                {cat.servicesService?.length || 0} Assigned Services
              </span>

              <button
                onClick={() => toggleFeatured(cat.id)}
                className={`flex items-center space-x-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all ${
                  cat.isFeatured !== false
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
                    : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>{cat.isFeatured !== false ? "Featured" : "Standard"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer Modal for New Category */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md space-y-6 overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Create Service Category
              </h3>
              <button
                onClick={() => setShowDrawer(false)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:bg-zinc-900 dark:hover:text-slate-200"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vaccinations & Immunisations"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">URL Slug</label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short description for patients browsing your online booking portal..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200/60 bg-slate-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <span className="block font-bold text-slate-800 dark:text-slate-200">
                  Category SEO Settings
                </span>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-400">Meta Title</label>
                  <input
                    type="text"
                    placeholder="Book Vaccinations & Travel Clinic Services"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 dark:border-zinc-900">
              <button
                onClick={() => {
                  if (newCategory.name) {
                    setCategories([
                      ...categories,
                      { id: Math.random().toString(), ...newCategory, servicesService: [] },
                    ]);
                    setShowDrawer(false);
                  }
                }}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

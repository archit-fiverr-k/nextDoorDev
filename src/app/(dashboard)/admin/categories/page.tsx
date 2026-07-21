import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, H2, P } from "@/components/ui/typography";
import {
  Plus,
  Trash2,
  Edit3,
  Layers,
  Search,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/super-admin";
import { uploadLogo } from "@/lib/r2";
import { ConfirmForm } from "@/components/forms/confirm-form";

export const revalidate = 0;

interface PageProps {
  searchParams: {
    q?: string;
    type?: string;
    editId?: string;
    error?: string;
    success?: string;
    page?: string;
  };
}

export default async function CategoryManagementPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin" && session.user.role !== "platform_admin") {
    redirect("/");
  }

  const query = searchParams.q || "";
  const typeFilter = searchParams.type || "";
  const editId = searchParams.editId || "";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  // Pagination parameters
  const currentPage = parseInt(searchParams.page || "1") || 1;
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // Query categories where deleted is false
  const whereClause: any = { deleted: false };
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }
  if (typeFilter) {
    whereClause.type = typeFilter;
  }

  const [categories, totalCount] = await Promise.all([
    db.category.findMany({
      where: whereClause,
      orderBy: [{ type: "asc" }, { displayOrder: "asc" }],
      skip,
      take: limit,
    }),
    db.category.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Load category to edit if editId provided
  const categoryToEdit = editId ? await db.category.findUnique({ where: { id: editId } }) : null;

  // Server Action handler
  const handleSaveCategory = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const type = formData.get("type") as "PROVIDER" | "HEALTHCARE" | "SERVICE";
    const description = formData.get("description") as string;
    const status = formData.get("status") as "ACTIVE" | "INACTIVE";
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
    const icon = formData.get("icon") as string;
    const color = formData.get("color") as string;

    // File upload parsing
    const iconFile = formData.get("iconFile") as File | null;
    let iconUrl = icon || undefined;

    if (iconFile && iconFile.size > 0) {
      try {
        const buffer = Buffer.from(await iconFile.arrayBuffer());
        iconUrl = await uploadLogo("category", buffer, iconFile.name, iconFile.type);
      } catch (err) {
        console.error("❌ R2 Category Icon Upload Error:", err);
      }
    }

    const payload = {
      name,
      slug,
      type,
      description: description || undefined,
      status,
      displayOrder,
      icon: iconUrl,
      color: color || undefined,
      imageUrl: iconUrl,
    };

    let res;
    if (editId) {
      res = await updateCategoryAction(editId, payload);
    } else {
      res = await createCategoryAction(payload);
    }

    if (!res.success) {
      redirect(
        `/admin/categories?q=${query}&type=${typeFilter}&page=${currentPage}${editId ? `&editId=${editId}` : ""}&error=${encodeURIComponent(res.error || "Save failed")}`
      );
    } else {
      redirect(
        `/admin/categories?q=${query}&type=${typeFilter}&page=${currentPage}&success=Saved successfully!`
      );
    }
  };

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await deleteCategoryAction(id);
    redirect(`/admin/categories?q=${query}&type=${typeFilter}&page=${currentPage}`);
  };

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Page Header */}
      <div className="dark:border-zinc-850 border-b border-slate-200/80 pb-6">
        <H1 className="font-black text-slate-900 dark:text-slate-50">Marketplace Categories</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Add, modify, or reorganize provider specialties, healthcare categories, and clinical
          services.
        </P>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Side: Create / Edit Form */}
        <div className="md:col-span-1">
          <div className="dark:border-zinc-850 sticky top-6 space-y-4 rounded border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
            <h2 className="border-b border-slate-100 pb-2 text-sm font-bold text-slate-800 dark:border-zinc-900 dark:text-slate-200">
              {categoryToEdit ? "Edit Category Details" : "Create New Category"}
            </h2>

            {errorMsg && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-[10px] font-bold text-rose-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="border-emerald-250 rounded border bg-emerald-50 p-3 text-[10px] font-bold text-emerald-800">
                {successMsg}
              </div>
            )}

            <form
              action={handleSaveCategory}
              className="space-y-4 text-xs"
              method="POST"
              encType="multipart/form-data"
            >
              <div>
                <label className="mb-1 block font-semibold text-slate-500">Category Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={categoryToEdit?.name || ""}
                  placeholder="e.g. Travel Health"
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-medium focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">SEO URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  required
                  defaultValue={categoryToEdit?.slug || ""}
                  placeholder="e.g. travel-health"
                  className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">Category Type</label>
                <select
                  name="type"
                  defaultValue={categoryToEdit?.type || "SERVICE"}
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="SERVICE">Service Category</option>
                  <option value="HEALTHCARE">Healthcare Category</option>
                  <option value="PROVIDER">Provider Specialty</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Upload Category Icon (Optional)
                </label>
                <input
                  type="file"
                  name="iconFile"
                  accept="image/*"
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
                {categoryToEdit?.icon && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">Current Icon:</span>
                    {categoryToEdit.icon.startsWith("/") ||
                    categoryToEdit.icon.startsWith("http") ? (
                      <img
                        src={categoryToEdit.icon}
                        alt="icon"
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <span className="font-mono text-[10px]">{categoryToEdit.icon}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Or Text Icon Identifier (Lucide / URL)
                </label>
                <input
                  type="text"
                  name="icon"
                  defaultValue={categoryToEdit?.icon || ""}
                  placeholder="e.g. Heart, Stethoscope"
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Accent Brand Color (Hex)
                </label>
                <input
                  type="text"
                  name="color"
                  defaultValue={categoryToEdit?.color || "#10B981"}
                  placeholder="e.g. #10B981"
                  className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  defaultValue={categoryToEdit?.displayOrder ?? 0}
                  className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">Taxonomy Status</label>
                <select
                  name="status"
                  defaultValue={categoryToEdit?.status || "ACTIVE"}
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="ACTIVE">Active (Live)</option>
                  <option value="INACTIVE">Inactive (Hidden)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={categoryToEdit?.description || ""}
                  placeholder="Brief description of the taxonomy..."
                  className="w-full rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="h-9 flex-1 rounded bg-slate-900 font-bold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {categoryToEdit ? "Save Updates" : "Create Category"}
                </button>
                {categoryToEdit && (
                  <Link
                    href="/admin/categories"
                    className="dark:border-zinc-850 dark:text-slate-350 flex h-9 items-center justify-center rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:bg-zinc-900"
                  >
                    Cancel
                  </Link>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Filters & Categories Directory List */}
        <div className="space-y-4 md:col-span-2">
          {/* Filters Card */}
          <div className="dark:border-zinc-850 rounded border border-slate-200/80 bg-white p-4 dark:bg-zinc-950">
            <form
              method="GET"
              action="/admin/categories"
              className="flex flex-col items-center gap-4 md:flex-row"
            >
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search taxonomy by name, slug..."
                  className="w-full rounded border border-slate-200 bg-white p-2 pl-10 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div className="w-full md:w-48">
                <select
                  name="type"
                  defaultValue={typeFilter}
                  className="w-full rounded border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="">All Types</option>
                  <option value="SERVICE">Service Category</option>
                  <option value="HEALTHCARE">Healthcare Category</option>
                  <option value="PROVIDER">Provider Specialty</option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 md:w-auto"
              >
                Search
              </button>
            </form>
          </div>

          {/* Table List Card */}
          <div className="dark:border-zinc-850 overflow-hidden rounded border border-slate-200/80 bg-white dark:bg-zinc-950">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/60">
                    <th className="p-3">Taxonomy Info</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Sort Order</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center italic text-slate-400">
                        No categories created.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {c.icon && (c.icon.startsWith("/") || c.icon.startsWith("http")) ? (
                              <img
                                src={c.icon}
                                alt={c.name}
                                className="h-5 w-5 shrink-0 rounded object-contain"
                              />
                            ) : (
                              <div
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border bg-slate-100 dark:bg-zinc-900"
                                style={{ borderColor: c.color || "#10B981" }}
                              >
                                <span
                                  className="text-[8px] font-bold"
                                  style={{ color: c.color || "#10B981" }}
                                >
                                  Icon
                                </span>
                              </div>
                            )}
                            <div>
                              <strong className="block font-bold text-slate-800 dark:text-slate-200">
                                {c.name}
                              </strong>
                              {c.description && (
                                <span className="block max-w-[150px] truncate text-[10px] text-slate-400">
                                  {c.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">{c.slug}</td>
                        <td className="p-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            {c.type}
                          </span>
                        </td>
                        <td className="text-slate-650 p-3 pl-8 font-semibold dark:text-zinc-400">
                          {c.displayOrder}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                              c.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                : "text-slate-450 bg-slate-100 dark:bg-zinc-800"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Link
                              href={`/admin/categories?q=${query}&type=${typeFilter}&page=${currentPage}&editId=${c.id}`}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800"
                              title="Edit Category"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>

                            <ConfirmForm
                              action={handleDelete}
                              message="Are you sure you want to delete this category? (It will be soft-deleted)"
                            >
                              <input type="hidden" name="id" value={c.id} />
                              <button
                                type="submit"
                                className="rounded p-1 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                title="Delete Category"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </ConfirmForm>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-3 text-xs dark:border-zinc-900/65 dark:bg-zinc-900/60">
                <span className="text-slate-500">
                  Page {currentPage} of {totalPages} ({totalCount} total categories)
                </span>
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/categories?q=${query}&type=${typeFilter}&page=${currentPage - 1}`}
                    className={`dark:border-zinc-850 text-slate-650 inline-flex items-center space-x-1 rounded border border-slate-200 px-3 py-1.5 font-bold hover:bg-slate-50 ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Previous</span>
                  </Link>
                  <Link
                    href={`/admin/categories?q=${query}&type=${typeFilter}&page=${currentPage + 1}`}
                    className={`dark:border-zinc-850 text-slate-650 inline-flex items-center space-x-1 rounded border border-slate-200 px-3 py-1.5 font-bold hover:bg-slate-50 ${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

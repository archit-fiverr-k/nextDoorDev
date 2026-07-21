"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  createServiceActionForm,
  updateServiceActionForm,
  toggleServiceStatusAction,
  deleteServiceAction,
  archiveServiceAction,
  bulkEnableServicesAction,
  bulkDisableServicesAction,
} from "@/actions/services";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  X,
  Archive,
  Image as ImageIcon,
  CheckSquare,
  Square,
  TrendingUp,
  FolderHeart,
  Palette,
  ClipboardList,
  Save,
  HelpCircle,
  FileCheck2,
  UploadCloud,
} from "lucide-react";

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: any;
  isActive: boolean;
  category: string | null;
  prepNotes: string | null;
  instructions: string | null;
  displayOrder: number;
  status: string;
  color: string | null;
  imageUrl: string | null;
  createdAt: Date;
  categoryId?: string | null;
  serviceSlug?: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ServicesViewProps {
  data: ServiceRow[];
  pharmacyId: string;
  categories: CategoryItem[];
}

const columnHelper = createColumnHelper<ServiceRow>();

export function ServicesView({ data, pharmacyId, categories }: ServicesViewProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "ACTIVE" | "DISABLED" | "ARCHIVED"
  >("all");
  const [isPending, startTransition] = React.useTransition();

  // Multi-select bulk state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Dialog / form state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServiceRow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Form states
  const [formFields, setFormFields] = React.useState({
    name: "",
    description: "",
    duration: "15",
    price: "0",
    isActive: "true",
    category: "General",
    prepNotes: "",
    instructions: "",
    displayOrder: "0",
    status: "ACTIVE",
    color: "#3b82f6",
    categoryId: "",
    serviceSlug: "",
  });

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const resetForm = () => {
    setFormFields({
      name: "",
      description: "",
      duration: "15",
      price: "0",
      isActive: "true",
      category: "",
      prepNotes: "",
      instructions: "",
      displayOrder: "0",
      status: "ACTIVE",
      color: "#3b82f6",
      categoryId: "",
      serviceSlug: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setActionError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditDialog = (service: ServiceRow) => {
    setFormFields({
      name: service.name,
      description: service.description || "",
      duration: String(service.duration),
      price: String(service.price),
      isActive: String(service.isActive),
      category: service.category || "",
      prepNotes: service.prepNotes || "",
      instructions: service.instructions || "",
      displayOrder: String(service.displayOrder),
      status: service.status,
      color: service.color || "#3b82f6",
      categoryId: service.categoryId || "",
      serviceSlug: service.serviceSlug || "",
    });
    setImageFile(null);
    setImagePreview(service.imageUrl);
    setActionError(null);
    setEditingService(service);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSuccessMsg(null);

    const envelope = new FormData();
    envelope.append("pharmacyId", pharmacyId);
    envelope.append("name", formFields.name);
    envelope.append("description", formFields.description);
    envelope.append("duration", formFields.duration);
    envelope.append("price", formFields.price);
    envelope.append("isActive", formFields.isActive);
    envelope.append("category", formFields.category);
    envelope.append("prepNotes", formFields.prepNotes);
    envelope.append("instructions", formFields.instructions);
    envelope.append("displayOrder", formFields.displayOrder);
    envelope.append("status", formFields.status);
    envelope.append("color", formFields.color);
    envelope.append("categoryId", formFields.categoryId);
    envelope.append("serviceSlug", formFields.serviceSlug);

    if (imageFile) {
      envelope.append("imageFile", imageFile);
    }

    startTransition(async () => {
      const res = await createServiceActionForm(envelope);
      if (res.success) {
        setSuccessMsg(`Service ${formFields.name} created successfully.`);
        setIsCreateOpen(false);
        resetForm();
      } else {
        setActionError(res.error || "Failed to create service");
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setActionError(null);
    setSuccessMsg(null);

    const envelope = new FormData();
    envelope.append("name", formFields.name);
    envelope.append("description", formFields.description);
    envelope.append("duration", formFields.duration);
    envelope.append("price", formFields.price);
    envelope.append("isActive", formFields.isActive);
    envelope.append("category", formFields.category);
    envelope.append("prepNotes", formFields.prepNotes);
    envelope.append("instructions", formFields.instructions);
    envelope.append("displayOrder", formFields.displayOrder);
    envelope.append("status", formFields.status);
    envelope.append("color", formFields.color);
    envelope.append("categoryId", formFields.categoryId);
    envelope.append("serviceSlug", formFields.serviceSlug);

    if (imageFile) {
      envelope.append("imageFile", imageFile);
    }

    startTransition(async () => {
      const res = await updateServiceActionForm(editingService.id, envelope);
      if (res.success) {
        setSuccessMsg(`Service ${formFields.name} updated successfully.`);
        setEditingService(null);
        resetForm();
      } else {
        setActionError(res.error || "Failed to update service");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await toggleServiceStatusAction(id, !currentStatus);
      if (res.success) {
        setSuccessMsg("Service active status toggled successfully.");
      }
    });
  };

  const handleArchive = (id: string) => {
    if (
      !confirm(
        "Are you sure you want to archive this service? Archived services are hidden from active lists but preserve booking history."
      )
    )
      return;
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await archiveServiceAction(id);
      if (res.success) {
        setSuccessMsg("Service archived successfully.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (
      !confirm("Are you sure you want to permanently delete this service? This cannot be undone.")
    )
      return;
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await deleteServiceAction(id);
      if (res.success) {
        setSuccessMsg("Service deleted successfully.");
      } else {
        alert(res.error || "Failed to delete service");
      }
    });
  };

  // Bulk Actions
  const handleBulkEnable = () => {
    if (selectedIds.length === 0) return;
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await bulkEnableServicesAction(selectedIds, pharmacyId);
      if (res.success) {
        setSuccessMsg(`Successfully enabled ${selectedIds.length} services.`);
        setSelectedIds([]);
      }
    });
  };

  const handleBulkDisable = () => {
    if (selectedIds.length === 0) return;
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await bulkDisableServicesAction(selectedIds, pharmacyId);
      if (res.success) {
        setSuccessMsg(`Successfully disabled ${selectedIds.length} services.`);
        setSelectedIds([]);
      }
    });
  };

  const handleToggleRowSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllSelection = (rows: ServiceRow[]) => {
    const activeIdsOnPage = rows.map((r) => r.id);
    const allSelected = activeIdsOnPage.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !activeIdsOnPage.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const uniqueNew = activeIdsOnPage.filter((id) => !prev.includes(id));
        return [...prev, ...uniqueNew];
      });
    }
  };

  // Filter local data
  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      if (statusFilter === "all") return row.status !== "ARCHIVED";
      return row.status === statusFilter;
    });
  }, [data, statusFilter]);

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <button
            onClick={() => handleToggleAllSelection(filteredData)}
            className="text-slate-400 transition-colors hover:text-slate-900"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isSelected = selectedIds.includes(row.id);
          return (
            <button
              onClick={() => handleToggleRowSelection(row.id)}
              className="text-slate-400 transition-colors hover:text-slate-900"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          );
        },
      }),
      columnHelper.accessor("name", {
        header: "Service",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-2.5">
              {/* Banner / Color dot */}
              <div
                style={{ backgroundColor: (row.color || "#3b82f6") + "20" }}
                className="relative flex h-8 w-11 shrink-0 select-none items-center justify-center overflow-hidden rounded-lg border border-slate-100"
              >
                {row.imageUrl ? (
                  <img src={row.imageUrl} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <FolderHeart className="h-4 w-4" style={{ color: row.color || "#3b82f6" }} />
                )}
              </div>
              <div>
                <span className="block font-bold text-slate-900 dark:text-slate-100">
                  {info.getValue()}
                </span>
                <span className="text-slate-455 block text-[10px] font-medium">
                  Category: {row.category || "General"} | Order: {row.displayOrder}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("description", {
        header: "Specs & Guidelines",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="max-w-[200px] leading-normal">
              <span
                className="block truncate font-medium text-slate-500"
                title={row.description || ""}
              >
                {row.description || <span className="text-slate-350 italic">No description</span>}
              </span>
              {row.prepNotes && (
                <span
                  className="text-blue-650 block truncate text-[9px] font-bold"
                  title={row.prepNotes}
                >
                  Notes: {row.prepNotes}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("duration", {
        header: "Duration",
        cell: (info) => (
          <span className="text-slate-550 font-semibold">{info.getValue()} mins</span>
        ),
      }),
      columnHelper.accessor("price", {
        header: "Billing Price",
        cell: (info) => (
          <span className="font-bold text-slate-900 dark:text-slate-50">
            £{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          const row = info.row.original;
          return (
            <span
              className={cn(
                "select-none rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                status === "ACTIVE" && "border-emerald-250 bg-emerald-50 text-emerald-700",
                status === "DISABLED" && "border-slate-200 bg-slate-50 text-slate-400",
                status === "ARCHIVED" && "border-rose-250 bg-rose-50 text-rose-700"
              )}
            >
              {status === "ACTIVE" && !row.isActive ? "ACTIVE (HIDDEN)" : status}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Operations",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(row)}
                className="h-8 px-2"
                title="Edit service details"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
              </Button>

              {/* Status toggler */}
              {row.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(row.id, row.isActive)}
                  disabled={isPending}
                  className="h-8 px-2.5 text-xs font-semibold"
                >
                  {row.isActive ? "Disable" : "Enable"}
                </Button>
              )}

              {/* Archive Action */}
              {row.status !== "ARCHIVED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArchive(row.id)}
                  disabled={isPending}
                  className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                  title="Archive service"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(row.id)}
                disabled={isPending}
                className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                title="Delete service"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [selectedIds, isPending, filteredData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Messages */}
      {successMsg && (
        <div className="border-emerald-250 flex items-center space-x-2 rounded-xl border bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 duration-150 animate-in fade-in">
          <Check className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Control panel and filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Status Tab list */}
        <div className="text-slate-550 flex select-none rounded-xl border border-slate-200/80 bg-slate-50 p-1 text-xs font-bold">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            )}
          >
            All Active
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "ACTIVE"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter("DISABLED")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "DISABLED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Disabled
          </button>
          <button
            onClick={() => setStatusFilter("ARCHIVED")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "ARCHIVED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Archived
          </button>
        </div>

        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <div className="relative w-full max-w-sm sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="focus:ring-blue-550 h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 text-xs font-semibold focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={openCreateDialog}
            className="hover:bg-slate-850 inline-flex h-10 cursor-pointer select-none items-center justify-center space-x-1 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Service</span>
          </button>
        </div>
      </div>

      {/* Bulk actions banner */}
      {selectedIds.length > 0 && (
        <div className="flex select-none items-center justify-between rounded-2xl border bg-slate-50 p-3 text-xs font-bold text-slate-700 duration-150 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4.5 w-4.5 text-blue-650" />
            <span>{selectedIds.length} services selected</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkEnable}
              disabled={isPending}
              className="h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-50"
            >
              Bulk Enable
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDisable}
              disabled={isPending}
              className="text-rose-650 h-8 border-rose-100 hover:bg-rose-50"
            >
              Bulk Disable
            </Button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-455 h-8 rounded-lg px-2.5 text-xs font-bold hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* TanStack Table Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[10px] font-extrabold uppercase text-slate-400"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-xs font-medium text-slate-400"
                >
                  No services found. Click &apos;Create Service&apos; to register one.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-xs font-semibold text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="text-slate-550 flex select-none items-center justify-between border-t border-slate-100 p-4 text-xs font-semibold">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8"
              >
                Next
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Create/Edit Service Modal */}
      {(isCreateOpen || editingService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex select-none items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                {isCreateOpen ? "Create Clinical Service" : "Edit Service Details"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingService(null);
                  resetForm();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <p className="rounded-xl border border-rose-200/60 bg-rose-50 p-2.5 text-[10px] font-bold text-rose-600">
                {actionError}
              </p>
            )}

            <form
              onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
              className="space-y-4"
            >
              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="e.g. Flu Vaccination"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Service Category *
                  </label>
                  <select
                    required
                    value={formFields.categoryId}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.id === e.target.value);
                      setFormFields({
                        ...formFields,
                        categoryId: e.target.value,
                        category: selectedCat ? selectedCat.name : "",
                      });
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="">Select Category...</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formFields.price}
                    onChange={(e) => setFormFields({ ...formFields, price: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Duration (mins) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formFields.duration}
                    onChange={(e) => setFormFields({ ...formFields, duration: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formFields.displayOrder}
                    onChange={(e) => setFormFields({ ...formFields, displayOrder: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Status
                  </label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Wizard Accent Color
                  </label>
                  <div className="flex select-none items-center space-x-2">
                    <input
                      type="color"
                      value={formFields.color}
                      onChange={(e) => setFormFields({ ...formFields, color: e.target.value })}
                      className="h-10 w-10 cursor-pointer rounded-xl border border-slate-200"
                    />
                    <input
                      type="text"
                      value={formFields.color}
                      onChange={(e) => setFormFields({ ...formFields, color: e.target.value })}
                      className="h-10 w-16 rounded-xl border text-center font-mono text-[10px] font-bold uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div className="select-none space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Show Banner Image?
                  </label>
                  <select
                    value={formFields.isActive}
                    onChange={(e) => setFormFields({ ...formFields, isActive: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="true">Show Active</option>
                    <option value="false">Hide (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Service Description
                </label>
                <textarea
                  value={formFields.description}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                  className="h-16 w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:outline-none"
                  placeholder="Describe treatment benefits..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Preparation Notes
                  </label>
                  <input
                    type="text"
                    value={formFields.prepNotes}
                    onChange={(e) => setFormFields({ ...formFields, prepNotes: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="e.g. Fast for 12 hours prior"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Booking Instructions
                  </label>
                  <input
                    type="text"
                    value={formFields.instructions}
                    onChange={(e) => setFormFields({ ...formFields, instructions: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="e.g. Arrive 10 minutes early"
                  />
                </div>
              </div>

              {/* Image upload (R2) */}
              <div className="select-none space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Service Banner Image
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <label className="text-slate-655 flex h-9 cursor-pointer items-center space-x-1 rounded-xl border border-slate-200 px-3 text-[10px] font-bold hover:bg-slate-50">
                    <UploadCloud className="text-slate-450 h-3.5 w-3.5" />
                    <span>Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="flex select-none justify-end space-x-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingService(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isCreateOpen ? "Create Service" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

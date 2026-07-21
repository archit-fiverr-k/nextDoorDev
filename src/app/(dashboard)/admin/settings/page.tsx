import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, H2, P } from "@/components/ui/typography";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  Calendar,
  Layout,
  Plus,
  Trash2,
  Edit3,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  updateSystemSettingsAction,
  updateCmsPageAction,
  createCmsFaqAction,
  updateCmsFaqAction,
  deleteCmsFaqAction,
} from "@/actions/super-admin";

export const revalidate = 0;
import { ConfirmForm } from "@/components/forms/confirm-form";

interface PageProps {
  searchParams: {
    tab?: string;
    editFaqId?: string;
    selectedCmsSlug?: string;
    error?: string;
    success?: string;
  };
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  const activeTab = searchParams.tab || "general";
  const editFaqId = searchParams.editFaqId || "";
  const selectedCmsSlug = searchParams.selectedCmsSlug || "terms";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  // Fetch settings
  let settings = await db.systemSetting.findFirst();
  if (!settings) {
    settings = await db.systemSetting.create({
      data: {
        isMaintenanceMode: false,
        announcementBanner: null,
      },
    });
  }

  // Fetch CMS FAQs
  const faqs = await db.cmsFaq.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const faqToEdit = editFaqId ? await db.cmsFaq.findUnique({ where: { id: editFaqId } }) : null;

  // Fetch CMS Page
  let cmsPage = await db.cmsPage.findUnique({
    where: { slug: selectedCmsSlug },
  });

  if (!cmsPage) {
    // preseed default dynamic page content
    cmsPage = {
      id: "",
      slug: selectedCmsSlug,
      title: `${selectedCmsSlug.charAt(0).toUpperCase() + selectedCmsSlug.slice(1)} Policy`,
      content: `Please customize this ${selectedCmsSlug} policy content.`,
      seoTitle: `${selectedCmsSlug.charAt(0).toUpperCase() + selectedCmsSlug.slice(1)} - NextDoorClinic`,
      seoDescription: `${selectedCmsSlug.charAt(0).toUpperCase() + selectedCmsSlug.slice(1)} details.`,
      seoKeywords: `healthcare, marketplace, ${selectedCmsSlug}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Server Action inline forms
  const handleUpdateGeneral = async (formData: FormData) => {
    "use server";
    const data = {
      isMaintenanceMode: formData.get("isMaintenanceMode") === "true",
      announcementBanner: formData.get("announcementBanner") as string,
      platformName: formData.get("platformName") as string,
      logoUrl: formData.get("logoUrl") as string,
      supportEmail: formData.get("supportEmail") as string,
      timezone: formData.get("timezone") as string,
      defaultLanguage: formData.get("defaultLanguage") as string,
    };
    const res = await updateSystemSettingsAction(data);
    if (!res.success)
      redirect(
        `/admin/settings?tab=general&error=${encodeURIComponent(res.error || "Update failed")}`
      );
    else redirect(`/admin/settings?tab=general&success=General branding settings updated!`);
  };

  const handleUpdateSecurity = async (formData: FormData) => {
    "use server";
    let settings = await db.systemSetting.findFirst();
    const data = {
      isMaintenanceMode: formData.get("isMaintenanceMode") === "true",
      announcementBanner: settings?.announcementBanner || null,
      platformName: settings?.platformName || "NextDoorClinic",
      logoUrl: settings?.logoUrl || null,
      supportEmail: settings?.supportEmail || "support@nextdoorclinic.com",
      timezone: settings?.timezone || "UTC",
      defaultLanguage: settings?.defaultLanguage || "en",
      passwordMinLength: parseInt(formData.get("passwordMinLength") as string) || 8,
      passwordRequireNumbers: formData.get("passwordRequireNumbers") === "true",
      passwordRequireSymbols: formData.get("passwordRequireSymbols") === "true",
      sessionTimeoutMinutes: parseInt(formData.get("sessionTimeoutMinutes") as string) || 60,
    };
    const res = await updateSystemSettingsAction(data);
    if (!res.success)
      redirect(
        `/admin/settings?tab=security&error=${encodeURIComponent(res.error || "Update failed")}`
      );
    else redirect(`/admin/settings?tab=security&success=Security policies updated!`);
  };

  const handleUpdateBooking = async (formData: FormData) => {
    "use server";
    let settings = await db.systemSetting.findFirst();
    const data = {
      isMaintenanceMode: settings?.isMaintenanceMode || false,
      announcementBanner: settings?.announcementBanner || null,
      platformName: settings?.platformName || "NextDoorClinic",
      logoUrl: settings?.logoUrl || null,
      supportEmail: settings?.supportEmail || "support@nextdoorclinic.com",
      timezone: settings?.timezone || "UTC",
      defaultLanguage: settings?.defaultLanguage || "en",
      passwordMinLength: settings?.passwordMinLength || 8,
      passwordRequireNumbers: settings?.passwordRequireNumbers || true,
      passwordRequireSymbols: settings?.passwordRequireSymbols || true,
      sessionTimeoutMinutes: settings?.sessionTimeoutMinutes || 60,
      defaultBufferTime: parseInt(formData.get("defaultBufferTime") as string) || 15,
      defaultBookingLimit: parseInt(formData.get("defaultBookingLimit") as string) || 1,
      defaultApprovalMode: formData.get("defaultApprovalMode") as string,
    };
    const res = await updateSystemSettingsAction(data);
    if (!res.success)
      redirect(
        `/admin/settings?tab=booking&error=${encodeURIComponent(res.error || "Update failed")}`
      );
    else redirect(`/admin/settings?tab=booking&success=Booking thresholds updated!`);
  };

  const handleSaveFaq = async (formData: FormData) => {
    "use server";
    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;
    const order = parseInt(formData.get("displayOrder") as string) || 0;
    const isActive = formData.get("isActive") === "true";

    const payload = { question, answer, displayOrder: order, isActive };

    let res;
    if (editFaqId) {
      res = await updateCmsFaqAction(editFaqId, payload);
    } else {
      res = await createCmsFaqAction(payload);
    }

    if (!res.success)
      redirect(`/admin/settings?tab=cms&error=${encodeURIComponent(res.error || "FAQ failed")}`);
    else redirect(`/admin/settings?tab=cms&success=FAQ saved successfully!`);
  };

  const handleDeleteFaq = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await deleteCmsFaqAction(id);
    redirect("/admin/settings?tab=cms");
  };

  const handleSaveCmsPage = async (formData: FormData) => {
    "use server";
    const slug = formData.get("slug") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const seoTitle = formData.get("seoTitle") as string;
    const seoDescription = formData.get("seoDescription") as string;
    const seoKeywords = formData.get("seoKeywords") as string;

    const res = await updateCmsPageAction({
      slug,
      title,
      content,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      seoKeywords: seoKeywords || undefined,
    });

    if (!res.success)
      redirect(
        `/admin/settings?tab=cms&selectedCmsSlug=${slug}&error=${encodeURIComponent(res.error || "Page failed")}`
      );
    else redirect(`/admin/settings?tab=cms&selectedCmsSlug=${slug}&success=Static page updated!`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <H1 className="font-black text-slate-900 dark:text-slate-50">Platform Settings</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Adjust general platform branding parameters, configure password & booking thresholds, and
          publish CMS content.
        </P>
      </div>

      {errorMsg && (
        <div className="border-rose-250 flex items-center space-x-2 rounded-lg border bg-rose-50 p-3 text-xs font-bold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="border-emerald-250 flex items-center space-x-2 rounded-lg border bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex w-full select-none items-center space-x-1 overflow-x-auto border-b border-slate-100 pb-2 dark:border-zinc-900">
        {[
          { id: "general", label: "General Branding", icon: Settings },
          { id: "security", label: "Security Policies", icon: Shield },
          { id: "booking", label: "Booking Engine", icon: Calendar },
          { id: "cms", label: "CMS Content Manager", icon: Layout },
        ].map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={`/admin/settings?tab=${t.id}`}
              className={`flex shrink-0 items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Tab Panels */}

      {/* 1. General Settings */}
      {activeTab === "general" && (
        <Card className="shadow-premium max-w-xl border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-6">
            <form action={handleUpdateGeneral} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-500">Platform Name</label>
                <input
                  type="text"
                  name="platformName"
                  required
                  defaultValue={settings.platformName}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">Platform Logo URL</label>
                <input
                  type="text"
                  name="logoUrl"
                  defaultValue={settings.logoUrl || ""}
                  placeholder="e.g. /assets/header-logo.png"
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Operations Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  required
                  defaultValue={settings.supportEmail}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Default Platform Timezone
                </label>
                <select
                  name="timezone"
                  defaultValue={settings.timezone}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="UTC">UTC (Universal Coordinated)</option>
                  <option value="America/New_York">EST (Eastern Standard Time)</option>
                  <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                  <option value="Asia/Kolkata">IST (Indian Standard Time)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Default System Language
                </label>
                <select
                  name="defaultLanguage"
                  defaultValue={settings.defaultLanguage}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                </select>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-zinc-900/60">
                <Button type="submit" className="font-bold">
                  Save General Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. Security Settings */}
      {activeTab === "security" && (
        <Card className="shadow-premium max-w-xl border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-6">
            <form action={handleUpdateSecurity} className="space-y-4 text-xs">
              <div className="border-slate-150 mb-2 flex items-center justify-between rounded-lg border bg-slate-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900">
                <div>
                  <strong className="mb-0.5 block text-slate-800 dark:text-slate-200">
                    Platform Maintenance Mode
                  </strong>
                  <span className="text-[10px] text-slate-500">
                    Lock the frontend and display a maintenance card to visitors
                  </span>
                </div>
                <select
                  name="isMaintenanceMode"
                  defaultValue={settings.isMaintenanceMode ? "true" : "false"}
                  className="rounded border border-slate-200 bg-white p-1 text-[11px] font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="false">Disabled (Live)</option>
                  <option value="true">Enabled (Locked)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  name="passwordMinLength"
                  defaultValue={settings.passwordMinLength}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Require Numbers in Passwords
                </label>
                <select
                  name="passwordRequireNumbers"
                  defaultValue={settings.passwordRequireNumbers ? "true" : "false"}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="true">Yes, require numbers</option>
                  <option value="false">No restriction</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Require Symbols in Passwords
                </label>
                <select
                  name="passwordRequireSymbols"
                  defaultValue={settings.passwordRequireSymbols ? "true" : "false"}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="true">Yes, require special characters</option>
                  <option value="false">No restriction</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Admin Session Timeout Threshold (Minutes)
                </label>
                <input
                  type="number"
                  name="sessionTimeoutMinutes"
                  defaultValue={settings.sessionTimeoutMinutes}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-zinc-900/60">
                <Button type="submit" className="font-bold">
                  Save Security Policies
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. Booking Engine Settings */}
      {activeTab === "booking" && (
        <Card className="shadow-premium max-w-xl border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardContent className="pt-6">
            <form action={handleUpdateBooking} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Default Slot Buffer Time (Minutes)
                </label>
                <input
                  type="number"
                  name="defaultBufferTime"
                  defaultValue={settings.defaultBufferTime}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
                <span className="mt-1 block text-[10px] text-slate-400">
                  Cooldown time added between adjacent appointments
                </span>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Default Max Bookings per Slot Limit
                </label>
                <input
                  type="number"
                  name="defaultBookingLimit"
                  defaultValue={settings.defaultBookingLimit}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-500">
                  Default Booking Approval Mode
                </label>
                <select
                  name="defaultApprovalMode"
                  defaultValue={settings.defaultApprovalMode}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                >
                  <option value="AUTOMATIC">Automatic Confirmation</option>
                  <option value="MANUAL">Manual Review (Pending confirmation by pharmacy)</option>
                </select>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-zinc-900/60">
                <Button type="submit" className="font-bold">
                  Save Engine Thresholds
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 4. CMS Content Settings */}
      {activeTab === "cms" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Static Pages & Policies list */}
          <div className="space-y-4 md:col-span-1">
            <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
              <CardHeader className="border-b border-slate-50 pb-2 dark:border-zinc-900">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Static Pages & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-2">
                <div className="text-slate-655 flex flex-col text-xs font-bold dark:text-zinc-400">
                  {[
                    { slug: "terms", label: "Terms of Service" },
                    { slug: "privacy", label: "Privacy Policy" },
                    { slug: "cookie", label: "Cookie Policy" },
                    { slug: "about", label: "About Us" },
                    { slug: "contact", label: "Contact Us" },
                  ].map((p) => {
                    const isActive = selectedCmsSlug === p.slug;
                    return (
                      <Link
                        key={p.slug}
                        href={`/admin/settings?tab=cms&selectedCmsSlug=${p.slug}`}
                        className={`flex items-center justify-between border-l-2 px-4 py-3 transition-all ${
                          isActive
                            ? "dark:border-zinc-150 border-slate-900 bg-slate-50 text-slate-900 dark:bg-zinc-900/40 dark:text-white"
                            : "border-transparent text-slate-500 hover:bg-slate-50/50 hover:text-slate-800"
                        }`}
                      >
                        <span>{p.label}</span>
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Static Page editor form */}
            <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
              <CardContent className="p-4">
                <form action={handleSaveCmsPage} className="space-y-4 text-xs">
                  <input type="hidden" name="slug" value={selectedCmsSlug} />
                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">Page Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={cmsPage.title}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">
                      Page Body (Markdown / Text)
                    </label>
                    <textarea
                      name="content"
                      required
                      rows={8}
                      defaultValue={cmsPage.content}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">SEO Title Tag</label>
                    <input
                      type="text"
                      name="seoTitle"
                      defaultValue={cmsPage.seoTitle || ""}
                      placeholder="SEO optimized title"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">
                      SEO Meta Description
                    </label>
                    <textarea
                      name="seoDescription"
                      rows={2}
                      defaultValue={cmsPage.seoDescription || ""}
                      placeholder="Compelling SERP excerpt"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">SEO Keywords</label>
                    <input
                      type="text"
                      name="seoKeywords"
                      defaultValue={cmsPage.seoKeywords || ""}
                      placeholder="comma-separated tags"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <Button type="submit" className="h-8 w-full text-xs font-bold">
                    Publish Page Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Homepage FAQs Management */}
          <div className="space-y-4 md:col-span-2">
            {/* FAQ Add Form */}
            <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
              <CardHeader className="border-b border-slate-50 pb-2 dark:border-zinc-900">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {faqToEdit ? "Edit FAQ Item" : "Create FAQ Question"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form action={handleSaveFaq} className="space-y-4 text-xs">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">Question Text</label>
                    <input
                      type="text"
                      name="question"
                      required
                      defaultValue={faqToEdit?.question || ""}
                      placeholder="e.g. How do I reschedule my booking?"
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-500">Answer Text</label>
                    <textarea
                      name="answer"
                      required
                      rows={3}
                      defaultValue={faqToEdit?.answer || ""}
                      placeholder="Write FAQ details..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-medium focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-500">
                        Display Order
                      </label>
                      <input
                        type="number"
                        name="displayOrder"
                        defaultValue={faqToEdit?.displayOrder ?? 0}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-500">Status</label>
                      <select
                        name="isActive"
                        defaultValue={faqToEdit?.isActive ? "true" : "false"}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                      >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="h-9 flex-1 font-bold">
                      {faqToEdit ? "Update FAQ Card" : "Publish FAQ Card"}
                    </Button>
                    {faqToEdit && (
                      <Link
                        href="/admin/settings?tab=cms"
                        className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        Cancel
                      </Link>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* FAQs list table */}
            <Card className="shadow-premium overflow-hidden border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/40">
                      <th className="p-3">FAQ Question</th>
                      <th className="p-3">Answer Preview</th>
                      <th className="p-3">Order</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
                    {faqs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center italic text-slate-400">
                          No FAQ items published.
                        </td>
                      </tr>
                    ) : (
                      faqs.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                          <td className="max-w-[150px] truncate p-3 font-bold text-slate-800 dark:text-slate-200">
                            {f.question}
                          </td>
                          <td className="max-w-[150px] truncate p-3 text-slate-500">{f.answer}</td>
                          <td className="text-slate-650 p-3 pl-6 font-semibold dark:text-zinc-400">
                            {f.displayOrder}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                                f.isActive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                  : "text-slate-450 bg-slate-100 dark:bg-zinc-800"
                              }`}
                            >
                              {f.isActive ? "ACTIVE" : "HIDDEN"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Link
                                href={`/admin/settings?tab=cms&editFaqId=${f.id}`}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800"
                                title="Edit FAQ"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Link>
                              <ConfirmForm
                                action={handleDeleteFaq}
                                message="Are you sure you want to delete this FAQ item?"
                              >
                                <input type="hidden" name="id" value={f.id} />
                                <button
                                  type="submit"
                                  className="rounded p-1 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  title="Delete FAQ"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

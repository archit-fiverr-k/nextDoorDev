import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { H1, H2, P } from "@/components/ui/typography";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Edit3, Send, Eye, Info, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { updateEmailTemplateAction, sendTestEmailAction } from "@/actions/super-admin";
import { getDefaultEmailTemplate } from "@/lib/email-templates";

export const revalidate = 0;

interface PageProps {
  searchParams: {
    template?: string;
    error?: string;
    success?: string;
  };
}

export default async function EmailTemplatesPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  const selectedName = searchParams.template || "PROVIDER_APPROVAL";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  // Standard required templates to pre-seed/list
  const templateList = [
    { name: "PROVIDER_APPROVAL", label: "Provider Approval", vars: "providerName, loginUrl" },
    { name: "PROVIDER_REJECTION", label: "Provider Rejection", vars: "providerName" },
    {
      name: "BOOKING_CONFIRMATION",
      label: "Booking Confirmation",
      vars: "patientName, providerName, serviceName, formattedTime, bookingId",
    },
    {
      name: "BOOKING_REMINDER",
      label: "Booking Reminder",
      vars: "patientName, serviceName, formattedTime, providerName",
    },
    {
      name: "BOOKING_CANCELLATION",
      label: "Booking Cancellation",
      vars: "patientName, serviceName, formattedTime, providerName",
    },
    { name: "PASSWORD_RESET", label: "Password Reset", vars: "userEmail, resetUrl" },
    { name: "EMAIL_VERIFICATION", label: "Email Verification OTP", vars: "otp" },
    {
      name: "SUBSCRIPTION_RENEWAL",
      label: "Subscription Renewal Alert",
      vars: "providerName, renewDate",
    },
    {
      name: "FAILED_PAYMENT",
      label: "Subscription Payment Failed",
      vars: "providerName, retryDate, invoiceUrl",
    },
  ];

  // Fetch or create selected template in DB
  let template = await db.emailTemplate.findUnique({
    where: { name: selectedName },
  });

  const isOldCardLayout =
    template &&
    (!template.body.includes("max-width: 640px") ||
      !template.body.includes("RECOMMENDED HEALTHCARE SERVICES") ||
      template.body.includes("Transforming Primary Care Access"));

  if (!template) {
    const defaultMeta = templateList.find((t) => t.name === selectedName);
    const seedData = getDefaultEmailTemplate(selectedName);
    template = await db.emailTemplate.create({
      data: {
        name: selectedName,
        subject: seedData.subject,
        body: seedData.body,
        variables: defaultMeta?.vars || "",
      },
    });
  } else if (isOldCardLayout) {
    const seedData = getDefaultEmailTemplate(selectedName);
    template = await db.emailTemplate.update({
      where: { name: selectedName },
      data: {
        subject: seedData.subject,
        body: seedData.body,
      },
    });
  }

  // Server action triggers
  const handleSave = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const vars = formData.get("variables") as string;

    const res = await updateEmailTemplateAction(name, subject, body, vars);
    if (!res.success) {
      redirect(
        `/admin/email-templates?template=${name}&error=${encodeURIComponent(res.error || "Failed to save")}`
      );
    } else {
      redirect(`/admin/email-templates?template=${name}&success=Template saved successfully!`);
    }
  };

  const handleSendTest = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const email = formData.get("testEmail") as string;

    const res = await sendTestEmailAction(name, email);
    if (!res.success) {
      redirect(
        `/admin/email-templates?template=${name}&error=${encodeURIComponent(res.error || "Test dispatch failed")}`
      );
    } else {
      redirect(
        `/admin/email-templates?template=${name}&success=Test email successfully dispatched! Check mock logs.`
      );
    }
  };

  // Interpolate mock variables for live preview rendering
  const getPreviewHtml = (subj: string, bodyText: string) => {
    const previewBody = bodyText
      .replace(/\{\{providerName\}\}/g, "Springfield Clinic")
      .replace(/\{\{patientName\}\}/g, "John Smith")
      .replace(/\{\{serviceName\}\}/g, "Influenza Vaccination")
      .replace(/\{\{formattedTime\}\}/g, new Date().toLocaleString())
      .replace(/\{\{bookingId\}\}/g, "APT-100293")
      .replace(/\{\{userEmail\}\}/g, "patient@email.com")
      .replace(/\{\{resetUrl\}\}/g, "http://localhost:3000/reset-password")
      .replace(/\{\{otp\}\}/g, "584920")
      .replace(
        /\{\{renewDate\}\}/g,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      )
      .replace(
        /\{\{retryDate\}\}/g,
        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString()
      )
      .replace(/\{\{invoiceUrl\}\}/g, "https://stripe.com/invoice/mock")
      .replace(/\{\{loginUrl\}\}/g, "http://localhost:3000/login");

    return {
      subject: subj,
      body: previewBody,
    };
  };

  const preview = getPreviewHtml(template.subject, template.body);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <H1 className="font-black text-slate-900 dark:text-slate-50">Email Template Manager</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Customize transactional notifications sent to clinic providers and patients, test
          delivery, and configure template bodies.
        </P>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Side: Templates Selector */}
        <div className="md:col-span-1">
          <Card className="shadow-premium sticky top-6 border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-slate-100 pb-3 dark:border-zinc-900/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Platform Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-2">
              <div className="flex flex-col">
                {templateList.map((t) => {
                  const isActive = selectedName === t.name;
                  return (
                    <Link
                      key={t.name}
                      href={`/admin/email-templates?template=${t.name}`}
                      className={`flex items-center justify-between border-l-2 px-4 py-3 text-xs font-bold transition-all ${
                        isActive
                          ? "dark:border-zinc-150 border-slate-900 bg-slate-50 text-slate-900 dark:bg-zinc-900/40 dark:text-white"
                          : "border-transparent text-slate-500 hover:bg-slate-50/50 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-900/10 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span>{t.label}</span>
                      <Mail
                        className={`h-3.5 w-3.5 ${isActive ? "animate-pulse text-blue-500" : "text-slate-400"}`}
                      />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Editor */}
        <div className="space-y-6 md:col-span-3">
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

          {/* Template Edit Form */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900/60">
              <CardTitle className="text-slate-850 text-sm font-bold dark:text-slate-200">
                Template Editor &mdash; {selectedName.replace(/_/g, " ")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form action={handleSave} className="space-y-4 text-xs">
                <input type="hidden" name="name" value={template.name} />
                <input type="hidden" name="variables" value={template.variables} />

                <div>
                  <label className="mb-1 block font-semibold text-slate-500">
                    Email Subject Header
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    defaultValue={template.subject}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-500">
                    Email Body Content (HTML Supported)
                  </label>
                  <textarea
                    name="body"
                    required
                    rows={12}
                    defaultValue={template.body}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>

                <div className="text-slate-650 flex items-start space-x-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div>
                    <strong className="mb-0.5 block text-slate-800 dark:text-slate-200">
                      Supported Interpolation Variables
                    </strong>
                    <span>
                      You can paste these tokens in the text editor. They will resolve dynamically
                      during dispatch:
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[9px]">
                      {template.variables.split(", ").map((v) => (
                        <span
                          key={v}
                          className="rounded bg-slate-200 px-1 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {"{{"}
                          {v}
                          {"}}"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-50 pt-2 dark:border-zinc-900">
                  <Button type="submit" className="h-9 font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Test Email Dispatch Card */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-slate-50 pb-2 dark:border-zinc-900">
              <CardTitle className="text-slate-850 text-sm font-bold dark:text-slate-200">
                Send Delivery Test
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form
                action={handleSendTest}
                className="flex flex-col items-end gap-4 text-xs sm:flex-row"
              >
                <input type="hidden" name="name" value={template.name} />
                <div className="w-full flex-1">
                  <label className="mb-1 block font-semibold text-slate-500">
                    Recipient Test Email Address
                  </label>
                  <input
                    type="email"
                    name="testEmail"
                    required
                    placeholder="e.g. tester@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-9 w-full items-center justify-center space-x-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Test Email</span>
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Live Preview Display */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Client Preview Renderer
              </CardTitle>
              <Eye className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-zinc-800/40 dark:bg-zinc-900">
                <span className="mr-1.5 font-semibold text-slate-400">Subject:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {preview.subject}
                </strong>
              </div>
              <div className="dark:border-zinc-850 overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                <div className="flex items-center justify-between bg-slate-100 p-2 font-mono text-[10px] text-slate-400 dark:bg-zinc-900">
                  <span>Client Window Render Preview</span>
                  <span>SMTP Secure Mode</span>
                </div>
                <div
                  className="overflow-x-auto bg-white p-6 text-slate-900 dark:bg-zinc-950 dark:text-slate-100"
                  dangerouslySetInnerHTML={{ __html: preview.body }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

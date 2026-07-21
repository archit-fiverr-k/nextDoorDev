import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, P } from "@/components/ui/typography";
import {
  CheckCircle,
  AlertCircle,
  CreditCard,
  Map,
  Mail,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { updateIntegrationsSettingsAction } from "@/actions/super-admin";

export const revalidate = 0;

interface PageProps {
  searchParams: {
    error?: string;
    success?: string;
  };
}

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  const hasAccess =
    session.user.role === "super_admin" ||
    (session.user.role === "platform_admin" && !!session.user.canManageIntegrations);
  if (!hasAccess) {
    redirect("/admin");
  }

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

  // Server action handler
  const handleUpdate = async (formData: FormData) => {
    "use server";
    const data = {
      stripePublishableKey: formData.get("stripePublishableKey") as string,
      stripeSecretKey: formData.get("stripeSecretKey") as string,
      stripeWebhookSecret: formData.get("stripeWebhookSecret") as string,
      stripeMode: formData.get("stripeMode") as string,
      googleMapsApiKey: formData.get("googleMapsApiKey") as string,
      smtpHost: formData.get("smtpHost") as string,
      smtpPort: formData.get("smtpPort") as string,
      smtpUsername: formData.get("smtpUsername") as string,
      smtpPassword: formData.get("smtpPassword") as string,
      smtpEncryption: formData.get("smtpEncryption") as string,
      recaptchaSiteKey: formData.get("recaptchaSiteKey") as string,
      recaptchaSecretKey: formData.get("recaptchaSecretKey") as string,
      isRecaptchaEnabled: formData.get("isRecaptchaEnabled") === "true",
      twilioAccountSid: formData.get("twilioAccountSid") as string,
      twilioAuthToken: formData.get("twilioAuthToken") as string,
      twilioPhoneNumber: formData.get("twilioPhoneNumber") as string,
      twilioWhatsappNumber: formData.get("twilioWhatsappNumber") as string,
    };

    const res = await updateIntegrationsSettingsAction(data);
    if (!res.success) {
      redirect(`/admin/integrations?error=${encodeURIComponent(res.error || "Failed to update")}`);
    } else {
      redirect(`/admin/integrations?success=Integrations configuration updated successfully!`);
    }
  };

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Page Header */}
      <div className="dark:border-zinc-850 border-b border-slate-200/80 pb-6">
        <H1 className="font-black text-slate-900 dark:text-slate-50">Platform Integrations</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Configure API credentials, secret keys, webhook signatures, reCAPTCHA tags, and SMTP
          servers.
        </P>
      </div>

      {errorMsg && (
        <div className="flex max-w-3xl items-center space-x-2 rounded border border-rose-200 bg-slate-50 p-3 text-xs font-bold text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex max-w-3xl items-center space-x-2 rounded border border-brand-teal bg-slate-50 p-3 text-xs font-bold text-brand-teal">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form action={handleUpdate} className="max-w-3xl space-y-8 text-xs">
        {/* Stripe Config */}
        <div className="dark:border-zinc-850 space-y-4 rounded border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-2 dark:border-zinc-900">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Stripe SaaS Payment Gateway
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-500">Publishable Key</label>
              <input
                type="text"
                name="stripePublishableKey"
                defaultValue={settings.stripePublishableKey || ""}
                placeholder="pk_test_..."
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">Secret Key</label>
              <input
                type="password"
                name="stripeSecretKey"
                defaultValue={settings.stripeSecretKey || ""}
                placeholder="sk_test_..."
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-500">
                Webhook Signing Secret
              </label>
              <input
                type="password"
                name="stripeWebhookSecret"
                defaultValue={settings.stripeWebhookSecret || ""}
                placeholder="whsec_..."
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">
                Gateway Execution Mode
              </label>
              <select
                name="stripeMode"
                defaultValue={settings.stripeMode}
                className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              >
                <option value="TEST">TEST Mode (Sandboxed)</option>
                <option value="LIVE">LIVE Mode (Real Payments)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Twilio SMS & WhatsApp Config */}
        <div className="dark:border-zinc-850 space-y-4 rounded border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-2 dark:border-zinc-900">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Twilio Communications Gateway
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-500">Account SID</label>
              <input
                type="text"
                name="twilioAccountSid"
                defaultValue={settings.twilioAccountSid || ""}
                placeholder="AC..."
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">Auth Token</label>
              <input
                type="password"
                name="twilioAuthToken"
                defaultValue={settings.twilioAuthToken || ""}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">
                Twilio Sender Number (SMS)
              </label>
              <input
                type="text"
                name="twilioPhoneNumber"
                defaultValue={settings.twilioPhoneNumber || ""}
                placeholder="+14155552671"
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">
                Twilio WhatsApp Number (Sender)
              </label>
              <input
                type="text"
                name="twilioWhatsappNumber"
                defaultValue={settings.twilioWhatsappNumber || ""}
                placeholder="+14155238886"
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Google Maps Config */}
        <div className="dark:border-zinc-850 space-y-4 rounded border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-2 dark:border-zinc-900">
            <Map className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Google Maps & Places Geocoding
            </h2>
          </div>
          <div>
            <label className="mb-1 block font-semibold text-slate-500">Google Maps API Key</label>
            <input
              type="password"
              name="googleMapsApiKey"
              defaultValue={settings.googleMapsApiKey || ""}
              placeholder="AIzaSy..."
              className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
            />
            <span className="mt-1 block text-[10px] text-slate-400">
              Provides address auto-complete and clinic maps placement
            </span>
          </div>
        </div>

        {/* SMTP Mail Server */}
        <div className="dark:border-zinc-850 space-y-4 rounded border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-2 dark:border-zinc-900">
            <Mail className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              SMTP Email Delivery Server
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-500">SMTP Host Server</label>
              <input
                type="text"
                name="smtpHost"
                defaultValue={settings.smtpHost || ""}
                placeholder="smtp.resend.com or smtp.mailtrap.io"
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">SMTP Port</label>
              <input
                type="number"
                name="smtpPort"
                defaultValue={settings.smtpPort || ""}
                placeholder="587 or 465"
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">SMTP Username</label>
              <input
                type="text"
                name="smtpUsername"
                defaultValue={settings.smtpUsername || ""}
                placeholder="resend"
                className="w-full rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">SMTP Password</label>
              <input
                type="password"
                name="smtpPassword"
                defaultValue={settings.smtpPassword || ""}
                placeholder="••••••••••••"
                className="w-full rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">
                Secure Encryption Protocol
              </label>
              <select
                name="smtpEncryption"
                defaultValue={settings.smtpEncryption || "NONE"}
                className="w-full rounded border border-slate-200 bg-white p-2 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              >
                <option value="NONE">NONE (Plain Text)</option>
                <option value="SSL">SSL (Implicit)</option>
                <option value="TLS">TLS (STARTTLS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Google reCAPTCHA */}
        <div className="dark:border-zinc-850 space-y-4 rounded border border-slate-200/80 bg-white p-6 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-2 dark:border-zinc-900">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Google reCAPTCHA Security
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-slate-500">reCAPTCHA Site Key</label>
              <input
                type="text"
                name="recaptchaSiteKey"
                defaultValue={settings.recaptchaSiteKey || ""}
                placeholder="6Leix..."
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-500">
                reCAPTCHA Secret Key
              </label>
              <input
                type="password"
                name="recaptchaSecretKey"
                defaultValue={settings.recaptchaSecretKey || ""}
                placeholder="6Leix...secret"
                className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-500">
                Protect Patient Registrations
              </label>
              <select
                name="isRecaptchaEnabled"
                defaultValue={settings.isRecaptchaEnabled ? "true" : "false"}
                className="w-48 rounded border border-slate-200 bg-white p-2 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              >
                <option value="false">Disabled (No Captcha)</option>
                <option value="true">Enabled (Anti-Bot Active)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex max-w-3xl justify-end">
          <button
            type="submit"
            className="h-10 rounded bg-slate-900 px-6 font-bold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save Integrations Credentials
          </button>
        </div>
      </form>
    </div>
  );
}

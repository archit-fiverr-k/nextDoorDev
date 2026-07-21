"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Search,
  Download,
  Printer,
  Settings,
  Link,
  Calendar,
  ArrowRight,
  Code,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: any;
  status: string;
}

interface Pharmacy {
  id: string;
  name: string;
  slug: string;
  brandColor?: string | null;
}

interface WidgetsViewProps {
  pharmacy: Pharmacy;
  services: Service[];
  bookingUrl: string;
}

export function WidgetsView({ pharmacy, services, bookingUrl }: WidgetsViewProps) {
  const [activeTab, setActiveTab] = useState<"button" | "iframe" | "qrcode" | "services">("button");
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  // Search query for direct service links
  const [searchQuery, setSearchQuery] = useState("");

  // Button customization states (synced with LocalStorage)
  const [btnText, setBtnText] = useState("Book Now");
  const [btnBgColor, setBtnBgColor] = useState(pharmacy.brandColor || "#2563eb");
  const [btnTextColor, setBtnTextColor] = useState("#ffffff");
  const [btnRadius, setBtnRadius] = useState("8px");
  const [btnSize, setBtnSize] = useState("md");
  const [btnShowIcon, setBtnShowIcon] = useState(true);

  // Iframe customization states (synced with LocalStorage)
  const [iframeWidth, setIframeWidth] = useState("100%");
  const [iframeHeight, setIframeHeight] = useState("700px");
  const [iframeRadius, setIframeRadius] = useState("12px");
  const [iframeShadow, setIframeShadow] = useState(
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  );

  // QR Code customization states
  const [qrSize, setQrSize] = useState<number>(300);

  // Load custom widget preferences from LocalStorage
  useEffect(() => {
    try {
      const storedBtnText = localStorage.getItem("ndc_widget_btn_text");
      if (storedBtnText) setBtnText(storedBtnText);

      const storedBtnBgColor = localStorage.getItem("ndc_widget_btn_bgcolor");
      if (storedBtnBgColor) setBtnBgColor(storedBtnBgColor);

      const storedBtnTextColor = localStorage.getItem("ndc_widget_btn_txtcolor");
      if (storedBtnTextColor) setBtnTextColor(storedBtnTextColor);

      const storedBtnRadius = localStorage.getItem("ndc_widget_btn_radius");
      if (storedBtnRadius) setBtnRadius(storedBtnRadius);

      const storedBtnSize = localStorage.getItem("ndc_widget_btn_size");
      if (storedBtnSize) setBtnSize(storedBtnSize);

      const storedBtnShowIcon = localStorage.getItem("ndc_widget_btn_showicon");
      if (storedBtnShowIcon) setBtnShowIcon(storedBtnShowIcon === "true");

      const storedIframeWidth = localStorage.getItem("ndc_widget_iframe_width");
      if (storedIframeWidth) setIframeWidth(storedIframeWidth);

      const storedIframeHeight = localStorage.getItem("ndc_widget_iframe_height");
      if (storedIframeHeight) setIframeHeight(storedIframeHeight);

      const storedIframeRadius = localStorage.getItem("ndc_widget_iframe_radius");
      if (storedIframeRadius) setIframeRadius(storedIframeRadius);

      const storedIframeShadow = localStorage.getItem("ndc_widget_iframe_shadow");
      if (storedIframeShadow) setIframeShadow(storedIframeShadow);
    } catch (e) {
      console.warn("Could not load widget settings from localStorage", e);
    }
  }, []);

  // Save changes to localStorage on change
  const savePreference = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Could not save widget settings to localStorage", e);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Button code generator
  const getButtonPadding = () => {
    if (btnSize === "sm") return "8px 14px";
    if (btnSize === "lg") return "14px 24px";
    return "10px 18px";
  };
  const getButtonFontSize = () => {
    if (btnSize === "sm") return "13px";
    if (btnSize === "lg") return "16px";
    return "14px";
  };

  const buttonSvgIcon = `<svg style="width: 16px; height: 16px; margin-right: 8px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

  const generatedButtonCode = `<a href="${bookingUrl}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; background-color: ${btnBgColor}; color: ${btnTextColor}; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: ${getButtonFontSize()}; font-weight: 600; padding: ${getButtonPadding()}; border-radius: ${btnRadius}; text-decoration: none; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04); transition: background-color 0.15s ease, transform 0.1s ease; cursor: pointer; outline: none;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
  ${btnShowIcon ? buttonSvgIcon + "\n  " : ""}${btnText}
</a>`;

  // Iframe code generator
  const generatedIframeCode = `<iframe src="${bookingUrl}" width="${iframeWidth}" height="${iframeHeight}" style="border: none; border-radius: ${iframeRadius}; box-shadow: ${iframeShadow}; width: ${iframeWidth}; height: ${iframeHeight};" allow="payment" title="NextDoorClinic Booking Widget"></iframe>`;

  // Download QR Code client-side blob helper
  const downloadQrCode = async (size: number) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(bookingUrl)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${pharmacy.slug}-booking-qr-${size}x${size}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Failed to download QR code", error);
    }
  };

  // Print QR Code generator
  const printQrCode = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${pharmacy.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center;
              padding: 40px;
              color: #0f172a;
              background-color: #ffffff;
            }
            .container {
              max-width: 420px;
              margin: 40px auto;
              border: 3px double #e2e8f0;
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            }
            .logo-placeholder {
              font-weight: 800;
              font-size: 24px;
              color: ${pharmacy.brandColor || "#2563eb"};
              margin-bottom: 24px;
              letter-spacing: -0.05em;
            }
            h1 {
              font-size: 26px;
              font-weight: 700;
              margin: 0 0 8px 0;
              letter-spacing: -0.025em;
            }
            p {
              font-size: 15px;
              color: #475569;
              margin: 0 0 32px 0;
              line-height: 1.5;
            }
            .qr-wrapper {
              margin-bottom: 32px;
              display: inline-block;
              padding: 16px;
              background: #f8fafc;
              border-radius: 16px;
              border: 1px solid #f1f5f9;
            }
            img {
              display: block;
              max-width: 250px;
              height: auto;
            }
            .footer-text {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-placeholder">NDC</div>
            <h1>${pharmacy.name}</h1>
            <p>Scan the QR code below to book your appointment online in just a few clicks.</p>
            <div class="qr-wrapper">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}" alt="QR Code" />
            </div>
            <div class="footer-text">Powered by NextDoorClinic</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter services list
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner hosted URL details */}
      <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-zinc-800/60">
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-500">
                Your Public Hosted URL
              </span>
              <div className="flex items-center space-x-2">
                <span className="select-all break-all font-mono text-sm font-semibold text-slate-800 dark:text-zinc-200 md:text-base">
                  {bookingUrl}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(bookingUrl, "hostedUrl")}
              >
                {copiedStates["hostedUrl"] ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4 text-slate-500" />
                    Copy Link
                  </>
                )}
              </Button>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 select-none items-center justify-center rounded-lg bg-blue-600 px-3 text-sm text-xs font-semibold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 focus-visible:outline-none"
              >
                View Booking Page
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs navigation for widgets options */}
      <div className="flex overflow-x-auto border-b border-slate-200 pb-px dark:border-zinc-800">
        {[
          { id: "button", label: "Book Now Button", icon: ArrowRight },
          { id: "iframe", label: "Iframe Embed", icon: Code },
          { id: "qrcode", label: "QR Code Flyer", icon: QrCode },
          { id: "services", label: "Direct Service Links", icon: Link },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`-mb-px flex items-center space-x-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold outline-none transition-all ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Controls & Code Block (Span 7) */}
        <div className="space-y-6 lg:col-span-7">
          {/* TAB 1: Book Now Button Settings */}
          {activeTab === "button" && (
            <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Customize Button</span>
                </CardTitle>
                <CardDescription>
                  Style the button to perfectly match your brand&apos;s website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Button Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={btnText}
                      onChange={(e) => {
                        setBtnText(e.target.value);
                        savePreference("ndc_widget_btn_text", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    />
                  </div>

                  {/* Colors */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Background Color (Hex)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={btnBgColor}
                        onChange={(e) => {
                          setBtnBgColor(e.target.value);
                          savePreference("ndc_widget_btn_bgcolor", e.target.value);
                        }}
                        className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200"
                      />
                      <input
                        type="text"
                        value={btnBgColor}
                        onChange={(e) => {
                          setBtnBgColor(e.target.value);
                          savePreference("ndc_widget_btn_bgcolor", e.target.value);
                        }}
                        className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Border Radius */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Corner Rounding
                    </label>
                    <select
                      value={btnRadius}
                      onChange={(e) => {
                        setBtnRadius(e.target.value);
                        savePreference("ndc_widget_btn_radius", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    >
                      <option value="0px">Sharp (0px)</option>
                      <option value="4px">Soft (4px)</option>
                      <option value="8px">Medium (8px)</option>
                      <option value="12px">Rounded (12px)</option>
                      <option value="9999px">Pill (Fully Round)</option>
                    </select>
                  </div>

                  {/* Button Size */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Button Size
                    </label>
                    <select
                      value={btnSize}
                      onChange={(e) => {
                        setBtnSize(e.target.value);
                        savePreference("ndc_widget_btn_size", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    >
                      <option value="sm">Small</option>
                      <option value="md">Regular</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>

                  {/* Show Icon */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Show Calendar Icon
                    </label>
                    <select
                      value={btnShowIcon ? "true" : "false"}
                      onChange={(e) => {
                        const val = e.target.value === "true";
                        setBtnShowIcon(val);
                        savePreference("ndc_widget_btn_showicon", String(val));
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                {/* HTML Output Code */}
                <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      HTML Embed Code
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generatedButtonCode, "btnCode")}
                      className="h-8 px-2"
                    >
                      {copiedStates["btnCode"] ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="dark:border-zinc-850 max-h-40 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {generatedButtonCode}
                  </pre>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Paste this HTML code block anywhere inside your website&apos;s body tags where
                    you want the button to appear.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Iframe Embed Settings */}
          {activeTab === "iframe" && (
            <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Customize Iframe</span>
                </CardTitle>
                <CardDescription>
                  Embed the entire booking wizard dynamically inside your website layout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Width */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Width (e.g. 100%, 800px)
                    </label>
                    <input
                      type="text"
                      value={iframeWidth}
                      onChange={(e) => {
                        setIframeWidth(e.target.value);
                        savePreference("ndc_widget_iframe_width", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Height (e.g. 700px, 80vh)
                    </label>
                    <input
                      type="text"
                      value={iframeHeight}
                      onChange={(e) => {
                        setIframeHeight(e.target.value);
                        savePreference("ndc_widget_iframe_height", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Corner Radius */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Corner Rounding
                    </label>
                    <select
                      value={iframeRadius}
                      onChange={(e) => {
                        setIframeRadius(e.target.value);
                        savePreference("ndc_widget_iframe_radius", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    >
                      <option value="0px">Sharp (0px)</option>
                      <option value="8px">Soft (8px)</option>
                      <option value="12px">Rounded (12px)</option>
                      <option value="20px">Extra Rounded (20px)</option>
                    </select>
                  </div>

                  {/* Shadow */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Frame Drop Shadow
                    </label>
                    <select
                      value={iframeShadow}
                      onChange={(e) => {
                        setIframeShadow(e.target.value);
                        savePreference("ndc_widget_iframe_shadow", e.target.value);
                      }}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    >
                      <option value="none">None</option>
                      <option value="0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)">
                        Light (sm)
                      </option>
                      <option value="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)">
                        Medium (md)
                      </option>
                      <option value="0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)">
                        Heavy (lg)
                      </option>
                    </select>
                  </div>
                </div>

                {/* HTML Output Code */}
                <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Iframe Embed HTML Code
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generatedIframeCode, "iframeCode")}
                      className="h-8 px-2"
                    >
                      {copiedStates["iframeCode"] ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="dark:border-zinc-850 max-h-40 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {generatedIframeCode}
                  </pre>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Paste this iframe snippet directly inside your site page to embed the fully
                    functional booking wizard without leaving your site.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: QR Code settings & print controls */}
          {activeTab === "qrcode" && (
            <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800/60">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <QrCode className="h-4 w-4 text-slate-500" />
                  <span>QR Code Flyer</span>
                </CardTitle>
                <CardDescription>
                  Print or download a high-resolution QR code for your pharmacy counter, receipts,
                  or marketing materials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="shrink-0 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
                        bookingUrl
                      )}`}
                      alt="Booking QR Code"
                      className="h-40 w-40 rounded-lg object-contain"
                    />
                  </div>
                  <div className="w-full flex-1 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Image Resolution Size
                      </label>
                      <select
                        value={qrSize}
                        onChange={(e) => setQrSize(Number(e.target.value))}
                        className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                      >
                        <option value="200">200 x 200 px (Web/Email)</option>
                        <option value="300">300 x 300 px (Cards/Receipts)</option>
                        <option value="500">500 x 500 px (Printed Flyers/Posters)</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => downloadQrCode(qrSize)}
                        className="min-w-[120px] flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={printQrCode}
                        className="min-w-[120px] flex-1"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Flyer
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      QR Image Link
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(
                          `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
                            bookingUrl
                          )}`,
                          "qrLink"
                        )
                      }
                      className="h-8 px-2"
                    >
                      {copiedStates["qrLink"] ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="dark:border-zinc-850 select-all overflow-x-auto break-all rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-[11px] text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
                      bookingUrl
                    )}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Direct Service Links with search */}
          {activeTab === "services" && (
            <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800/60">
              <CardHeader>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Link className="h-4 w-4 text-slate-500" />
                      <span>Direct Booking Links</span>
                    </CardTitle>
                    <CardDescription>
                      Share URLs that bypass the service catalog selection step and open the wizard
                      directly on a specific service.
                    </CardDescription>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dark:border-zinc-850 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-slate-50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredServices.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-500">
                    No active services found matching your search.
                  </div>
                ) : (
                  <div className="max-h-[350px] divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-900">
                    {filteredServices.map((service) => {
                      const directUrl = `${bookingUrl}?serviceId=${service.id}`;
                      const isCopied = copiedStates[service.id];
                      return (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                        >
                          <div className="min-w-0 pr-4">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {service.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {service.duration} mins • £{service.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => handleCopy(directUrl, service.id)}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                                    Copied
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-1 h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                                    Copy
                                  </span>
                                </>
                              )}
                            </Button>
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-0 text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Previews (Span 5) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Booking Page Preview Panel */}
          <Card className="flex h-full flex-col overflow-hidden border-slate-200/80 shadow-sm dark:border-zinc-800/60">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <span>Live Interactive Preview</span>
              </CardTitle>
              <CardDescription>
                See how your widget will behave and look to your customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center bg-slate-50/20 p-6 dark:bg-zinc-950/20">
              {activeTab === "button" && (
                <div className="space-y-6 py-10 text-center">
                  <div className="mx-auto inline-block min-w-[240px] rounded-xl border border-slate-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Simulated Website
                    </div>
                    {/* Rendered Custom Button Preview */}
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex select-none items-center justify-center shadow-sm transition-all duration-150 hover:scale-[1.01] hover:opacity-90 active:scale-[0.98]"
                      style={{
                        backgroundColor: btnBgColor,
                        color: btnTextColor,
                        borderRadius: btnRadius,
                        fontSize: getButtonFontSize(),
                        padding: getButtonPadding(),
                        fontWeight: 600,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        border: "none",
                        textDecoration: "none",
                      }}
                    >
                      {btnShowIcon && (
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      )}
                      {btnText}
                    </a>
                  </div>
                  <p className="mx-auto max-w-xs text-xs text-slate-400 dark:text-zinc-500">
                    Click the button in this preview window to test opening your public booking
                    landing page.
                  </p>
                </div>
              )}

              {activeTab === "iframe" && (
                <div className="space-y-4">
                  {/* Simulated Browser Bar */}
                  <div className="flex shrink-0 items-center space-x-1.5 rounded-t-xl bg-slate-200/80 px-4 py-2 dark:bg-zinc-800">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <div className="ml-4 flex-1 select-none truncate rounded-md bg-white px-3 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-zinc-900 dark:text-zinc-500">
                      https://yourwebsite.com/booking-page
                    </div>
                  </div>

                  {/* Simulated Iframe container */}
                  <div
                    className="dark:border-zinc-850 relative flex flex-col overflow-hidden border border-t-0 border-slate-200/60 bg-white dark:bg-zinc-900"
                    style={{
                      height: "280px",
                      borderRadius: `0 0 ${iframeRadius} ${iframeRadius}`,
                      boxShadow: iframeShadow,
                    }}
                  >
                    {/* Simulated Header inside iframe */}
                    <div className="dark:border-zinc-850 flex h-10 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 dark:bg-zinc-900/30">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: pharmacy.brandColor || "#2563eb" }}
                        />
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {pharmacy.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                        Step 1 of 5
                      </span>
                    </div>

                    {/* Simulated content representing the booking flow */}
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-zinc-800" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                          <div className="space-y-1">
                            <div className="h-2.5 w-24 rounded bg-slate-300 dark:bg-zinc-700" />
                            <div className="h-1.5 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
                          </div>
                          <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-600">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          </div>
                        </div>
                        <div className="dark:border-zinc-850 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/20 p-2.5">
                          <div className="space-y-1">
                            <div className="h-2.5 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
                            <div className="dark:bg-zinc-850 h-1.5 w-12 rounded bg-slate-100" />
                          </div>
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-zinc-700" />
                        </div>
                      </div>
                    </div>

                    {/* Simulated footer inside iframe */}
                    <div className="dark:border-zinc-850 flex h-10 items-center justify-end border-t border-slate-100 bg-slate-50/50 px-4 dark:bg-zinc-900/30">
                      <div
                        className="flex h-6 w-16 items-center justify-center rounded text-[9px] font-bold text-white"
                        style={{ backgroundColor: pharmacy.brandColor || "#2563eb" }}
                      >
                        Continue
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "qrcode" && (
                <div className="space-y-4 py-6 text-center">
                  <div className="dark:border-zinc-850 mx-auto inline-block max-w-[280px] rounded-2xl border border-slate-200/60 bg-white p-8 shadow-md dark:bg-zinc-900">
                    <div className="mb-2 truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {pharmacy.name}
                    </div>
                    <div className="mb-2 inline-block rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-zinc-900 dark:bg-zinc-950">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                          bookingUrl
                        )}`}
                        alt="QR Code Preview"
                        className="h-32 w-32 object-contain"
                      />
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Scan to Book Appointment
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "services" && (
                <div className="mx-auto max-w-xs space-y-4 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-blue-100/60 bg-blue-50 text-lg font-bold text-blue-600 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-blue-500">
                    Url
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Direct-to-Service Router
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      When a patient visits a direct service link, they skip the services catalog
                      page and start directly on the date and time scheduler steps.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

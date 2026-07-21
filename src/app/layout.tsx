import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@/styles/globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { CrossTabSyncProvider } from "@/components/auth/cross-tab-sync-provider";
import { InactivityTimerProvider } from "@/components/auth/inactivity-timer-provider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextDoorClinic — UK Healthcare Marketplace & Pharmacy Network",
  description:
    "Book private healthcare appointments, travel immunisations, and consultations at verified GPhC regulated UK high street pharmacies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${manrope.variable} h-full overflow-x-hidden font-sans antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <CrossTabSyncProvider>
            <InactivityTimerProvider>{children}</InactivityTimerProvider>
          </CrossTabSyncProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

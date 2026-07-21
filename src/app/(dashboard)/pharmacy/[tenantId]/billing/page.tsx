"use client";

import React from "react";
import {
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  Building2,
  Plus,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface BillingPageProps {
  params: {
    tenantId: string;
  };
}

export default function BillingPage({ params }: BillingPageProps) {
  const invoices = [
    {
      id: "INV-2026-007",
      date: "Jul 20, 2026",
      amount: "£99.00",
      status: "PAID",
      pdf: "Invoice_Jul_2026.pdf",
    },
    {
      id: "INV-2026-006",
      date: "Jun 20, 2026",
      amount: "£99.00",
      status: "PAID",
      pdf: "Invoice_Jun_2026.pdf",
    },
    {
      id: "INV-2026-005",
      date: "May 20, 2026",
      amount: "£99.00",
      status: "PAID",
      pdf: "Invoice_May_2026.pdf",
    },
  ];

  const downloadInvoice = (invoice: any) => {
    const dummyContent = `TAX INVOICE - NextDoorClinic Platform\nInvoice Number: ${invoice.id}\nDate: ${invoice.date}\nAmount Paid: ${invoice.amount}\nVAT (20%): £16.50\nStatus: PAID`;
    const blob = new Blob([dummyContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = invoice.pdf;
    link.click();
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Payment History & Stripe Billing
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Download tax invoices, update corporate payment cards, and inspect past transactions.
          </p>
        </div>

        <button
          onClick={() => alert("Redirecting securely to Stripe Customer Portal...")}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open Stripe Customer Portal</span>
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Saved Payment Methods & Address (1 col) */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Default Payment Card
            </h3>

            <div className="space-y-3 rounded-xl bg-slate-900 p-4 text-white shadow-md dark:bg-zinc-900">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold tracking-wider">STRIPE SECURE</span>
                <CreditCard className="h-5 w-5 text-teal-400" />
              </div>
              <p className="pt-2 font-mono text-base font-extrabold tracking-widest">
                •••• •••• •••• 4242
              </p>
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                <span>EXP: 12/28</span>
                <span>VISA CORPORATE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table (2 cols) */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Past Billing Statements & VAT Invoices
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 dark:border-zinc-900">
                  <th className="pb-3">Invoice Ref</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 dark:divide-zinc-900 dark:text-zinc-300">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {inv.id}
                    </td>
                    <td className="py-3 font-mono text-[11px]">{inv.date}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                      {inv.amount}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => downloadInvoice(inv)}
                        className="inline-flex items-center space-x-1 font-bold text-teal-600 hover:underline dark:text-teal-400"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

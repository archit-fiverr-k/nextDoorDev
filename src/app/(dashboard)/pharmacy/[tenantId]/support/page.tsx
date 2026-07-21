"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  PhoneCall,
  FileText,
  CheckCircle2,
  Send,
  UserCheck,
  Search,
} from "lucide-react";

interface SupportPageProps {
  params: {
    tenantId: string;
  };
}

export default function SupportPage({ params }: SupportPageProps) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSubject && ticketMessage) {
      setSubmitted(true);
    }
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Provider Priority Support & Help Center
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Access knowledge base articles, submit technical tickets to the NextDoorClinic team, or
          contact your dedicated account manager.
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Account Manager Card & Quick Contacts (1 col) */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Dedicated Account Manager
            </h3>

            <div className="flex items-center space-x-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-sm font-bold text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-300">
                DR
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">David Ross</h4>
                <p className="text-[10px] text-slate-400">Senior Pharmacy Success Specialist</p>
                <p className="mt-0.5 font-mono text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  david.ross@nextdoorclinic.co.uk
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Ticket Form (2 cols) */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Submit Priority Support Ticket
          </h3>

          {submitted ? (
            <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50 p-6 text-center dark:border-teal-900/40 dark:bg-teal-950/30">
              <CheckCircle2 className="mx-auto h-8 w-8 text-teal-600" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                Ticket Submitted Successfully!
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Ticket #NDC-8942 has been assigned to our engineering support team. Response
                estimated within 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Issue Category
                </label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900">
                  <option>Booking Engine / Calendar Schedule</option>
                  <option>Stripe Payouts & Billing</option>
                  <option>Patient CRM & Data Management</option>
                  <option>Staff & Role Permissions</option>
                  <option>Feature Request / Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of issue..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe the steps or issue you are experiencing..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <button
                type="submit"
                className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
              >
                <Send className="h-4 w-4" />
                <span>Submit Ticket</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

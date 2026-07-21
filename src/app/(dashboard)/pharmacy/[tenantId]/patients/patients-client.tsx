"use client";

import React, { useState } from "react";
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  ShieldAlert,
  Download,
  Trash2,
  Plus,
  Activity,
  Clock,
  Paperclip,
  CheckCircle2,
  Tag,
  ChevronRight,
  Stethoscope,
  Lock,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

interface PatientsClientProps {
  pharmacyId: string;
  initialPatients: any[];
}

export default function PatientsClient({ pharmacyId, initialPatients }: PatientsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(initialPatients[0] || null);
  const [activeTab, setActiveTab] = useState<
    "summary" | "notes" | "appointments" | "documents" | "gdpr"
  >("summary");
  const [noteType, setNoteType] = useState<"CLINICAL" | "INTERNAL">("CLINICAL");
  const [newNote, setNewNote] = useState("");

  const filteredPatients = initialPatients.filter((p) => {
    const matchesSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesTag = selectedTag === "all" || (p.tags && p.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const handleGDPRDownload = (patient: any) => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patient, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `GDPR_Export_${patient.firstName}_${patient.lastName}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="select-text space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Patient Records & Medical CRM
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Search patient directory, review clinical notes, manage consent records, and execute
            GDPR exports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="rounded-xl border border-slate-200/60 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
            Total Patients: {initialPatients.length}
          </span>
        </div>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Side: Directory Table (5 cols) */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 lg:col-span-5">
          {/* Search and Tag filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
              {["all", "Travel", "Vaccine", "Blood", "Ear Wax", "Regular"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1 capitalize transition-colors ${
                    selectedTag === tag
                      ? "bg-slate-900 font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Directory List */}
          <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-zinc-900">
            {filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-xs font-medium text-slate-400">
                No matching patient records found.
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id;
                return (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`my-1 flex cursor-pointer items-center justify-between space-x-3 rounded-xl p-3 transition-all ${
                      isSelected
                        ? "border border-teal-200/80 bg-teal-50/70 dark:border-teal-900/40 dark:bg-teal-950/30"
                        : "border border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100 text-xs font-extrabold text-slate-700 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-300">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-zinc-500">
                          {patient.email} • {patient.phone}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Patient Profile & Charting Panel (7 cols) */}
        <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 lg:col-span-7">
          {selectedPatient ? (
            <>
              {/* Patient Profile Header */}
              <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-zinc-900 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-base font-extrabold text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/40 dark:text-teal-300">
                    {selectedPatient.firstName[0]}
                    {selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <h2 className="flex items-center space-x-2 text-base font-bold text-slate-900 dark:text-slate-50">
                      <span>
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </span>
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Active Patient
                      </span>
                    </h2>
                    <p className="mt-0.5 flex items-center space-x-3 text-xs text-slate-500 dark:text-zinc-400">
                      <span>
                        DOB:{" "}
                        {selectedPatient.dateOfBirth
                          ? format(new Date(selectedPatient.dateOfBirth), "MMM d, yyyy")
                          : "N/A"}
                      </span>
                      <span>•</span>
                      <span>Gender: {selectedPatient.gender || "Unspecified"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleGDPRDownload(selectedPatient)}
                    className="flex items-center space-x-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>GDPR Export</span>
                  </button>
                </div>
              </div>

              {/* Patient Navigation Tabs */}
              <div className="flex space-x-2 border-b border-slate-100 pb-2 text-xs font-semibold dark:border-zinc-900">
                {(["summary", "notes", "appointments", "documents", "gdpr"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-3 py-1.5 capitalize transition-all ${
                      activeTab === tab
                        ? "bg-slate-900 font-bold text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab 1: Summary Overview */}
              {activeTab === "summary" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/40">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Contact Info
                      </span>
                      <p className="flex items-center space-x-2 font-semibold text-slate-800 dark:text-zinc-200">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{selectedPatient.email}</span>
                      </p>
                      <p className="flex items-center space-x-2 font-semibold text-slate-800 dark:text-zinc-200">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{selectedPatient.phone}</span>
                      </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/40">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Emergency Contact
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200">
                        {selectedPatient.emergencyContactName || "Not provided"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedPatient.emergencyContactPhone || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Medical History & Allergies */}
                  <div className="space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <h4 className="flex items-center space-x-1.5 font-bold text-amber-900 dark:text-amber-200">
                      <Stethoscope className="h-4 w-4 text-amber-600" />
                      <span>Clinical Medical History & Risk Warnings</span>
                    </h4>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      No known severe drug allergies declared. Patient completed online
                      pre-consultation medical questionnaire on{" "}
                      {format(new Date(selectedPatient.createdAt), "MMM d, yyyy")}.
                    </p>
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      Patient Activity Timeline
                    </h4>
                    <div className="space-y-2 border-l-2 border-slate-100 pl-2 dark:border-zinc-800">
                      {selectedPatient.appointments?.map((app: any) => (
                        <div key={app.id} className="relative space-y-0.5 pl-4 text-[11px]">
                          <div className="absolute -left-[9px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500 dark:border-zinc-950" />
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Booked: {app.service?.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {format(new Date(app.startTime), "MMM d, yyyy 'at' h:mm a")} • Status:{" "}
                            {app.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Clinical & Internal Notes */}
              {activeTab === "notes" && (
                <div className="space-y-4 text-xs">
                  {/* Note input box */}
                  <div className="space-y-3 rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setNoteType("CLINICAL")}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            noteType === "CLINICAL"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          Clinical Consultation Note
                        </button>
                        <button
                          onClick={() => setNoteType("INTERNAL")}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            noteType === "INTERNAL"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          Internal Staff Note
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      placeholder={
                        noteType === "CLINICAL"
                          ? "Enter clinical observation, dosage recommendations, or consultation details..."
                          : "Enter internal pharmacy reception note (visible to staff only)..."
                      }
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (newNote.trim()) {
                            selectedPatient.crmNotes = [
                              {
                                id: Math.random().toString(),
                                note: newNote,
                                type: noteType,
                                createdAt: new Date().toISOString(),
                              },
                              ...(selectedPatient.crmNotes || []),
                            ];
                            setNewNote("");
                          }
                        }}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                      >
                        Add Chart Note
                      </button>
                    </div>
                  </div>

                  {/* Notes Feed */}
                  <div className="space-y-3">
                    {selectedPatient.crmNotes?.map((note: any) => (
                      <div
                        key={note.id}
                        className={`space-y-1 rounded-xl border p-3.5 ${
                          note.type === "CLINICAL"
                            ? "border-teal-100 bg-teal-50/40 dark:border-teal-900/30 dark:bg-teal-950/20"
                            : "border-slate-200/60 bg-slate-50 dark:border-zinc-800/40 dark:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span
                            className={`rounded px-1.5 py-0.5 font-bold uppercase ${
                              note.type === "CLINICAL"
                                ? "bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-200"
                                : "bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {note.type}
                          </span>
                          <span className="text-slate-400">
                            {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-zinc-200">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Appointments */}
              {activeTab === "appointments" && (
                <div className="space-y-3 text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 dark:border-zinc-900">
                          <th className="pb-2">Service</th>
                          <th className="pb-2">Date & Time</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700 dark:divide-zinc-900 dark:text-zinc-300">
                        {selectedPatient.appointments?.map((app: any) => (
                          <tr key={app.id}>
                            <td className="py-2.5 font-bold">{app.service?.name}</td>
                            <td className="py-2.5 font-mono text-[11px]">
                              {format(new Date(app.startTime), "MMM d, yyyy 'at' h:mm a")}
                            </td>
                            <td className="py-2.5 text-right font-mono text-[10px]">
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Uploaded Documents */}
              {activeTab === "documents" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/40">
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      Patient Uploads & Medical Certificates
                    </span>
                    <button className="flex items-center space-x-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Upload PDF</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-900">
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-4 w-4 text-teal-600" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Patient_Medical_Consent_Form.pdf
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Uploaded 12 days ago • 240 KB
                          </span>
                        </div>
                      </div>
                      <button className="font-bold text-teal-600 hover:underline">Download</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: GDPR Compliance */}
              {activeTab === "gdpr" && (
                <div className="space-y-4 rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-xs dark:border-zinc-800/60 dark:bg-zinc-900/40">
                  <h4 className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-50">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    <span>GDPR Compliance & Right to Erasure</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                    Under the UK General Data Protection Regulation (UK GDPR), patients have the
                    right to request a full export of their personal health record or request data
                    anonymization.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => handleGDPRDownload(selectedPatient)}
                      className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Machine-Readable JSON Export</span>
                    </button>

                    <button
                      onClick={() =>
                        alert(
                          "GDPR Anonymization Request queued. Patient data will be purged within 30 days per legal retention policy."
                        )
                      }
                      className="flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Request GDPR Data Erasure</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-xs font-medium text-slate-400">
              Select a patient from the directory to view profile and medical chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import type { Metadata } from "next";
import {
  getPatientDashboardStatsAction,
  getPatientAppointmentsAction,
} from "@/actions/patient-appointments";
import { getRecentPatientNotificationsAction } from "@/actions/patient-notifications";
import { getPatientProfileAction } from "@/actions/patient";
import { PatientCompanionView } from "./patient-companion-view";

export const metadata: Metadata = {
  title: "Patient Healthcare Dashboard | NextDoorClinic",
  description:
    "Personal healthcare companion portal. Track appointments, view medical records, and book clinical services.",
};

export default async function PatientDashboardPage() {
  const [statsRes, notificationsRes, profileRes, appointmentsRes] = await Promise.all([
    getPatientDashboardStatsAction(),
    getRecentPatientNotificationsAction(5),
    getPatientProfileAction(),
    getPatientAppointmentsAction({ status: "ALL" }),
  ]);

  const profile =
    profileRes.success && profileRes.data
      ? profileRes.data
      : { firstName: "Patient", lastName: "", email: "" };

  const stats = statsRes.success && statsRes.data ? statsRes.data : { nextAppointment: null };

  const rawNotifications = notificationsRes.success ? notificationsRes.data : [];
  const rawAppointments =
    appointmentsRes.success && appointmentsRes.data ? appointmentsRes.data : [];

  // Map Next Appointment
  const nextApp = stats.nextAppointment
    ? {
        id: stats.nextAppointment.id,
        serviceName: stats.nextAppointment.service?.name || "Clinical Service",
        pharmacyName: stats.nextAppointment.pharmacy?.name || "Pharmacy Clinic",
        pharmacyAddress: stats.nextAppointment.pharmacy?.address || "UK Location",
        pharmacyPhone: "0113 245 9182",
        date: stats.nextAppointment.startTime
          ? new Date(stats.nextAppointment.startTime).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })
          : "Upcoming",
        time: stats.nextAppointment.startTime
          ? new Date(stats.nextAppointment.startTime).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Scheduled",
        status: String(stats.nextAppointment.status),
      }
    : null;

  // Map Upcoming Appointments
  const upcomingAppointments = rawAppointments
    .filter((a: any) => a.status === "CONFIRMED" || a.status === "PENDING")
    .map((a: any) => ({
      id: a.id,
      serviceName: a.service?.name || "Clinical Service",
      pharmacyName: a.pharmacy?.name || "Pharmacy Clinic",
      pharmacyAddress: a.pharmacy?.address || "UK Location",
      date: a.startTime
        ? new Date(a.startTime).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
        : "Scheduled",
      time: a.startTime
        ? new Date(a.startTime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Scheduled",
      status: String(a.status),
    }));

  // Recent Activity
  const recentActivity = [
    {
      id: "act-1",
      title: "Appointment Confirmed at Briggate Pharmacy",
      timestamp: "2 hours ago",
      type: "approved" as const,
    },
    {
      id: "act-2",
      title: "Winter Flu Vaccination Recorded",
      timestamp: "3 days ago",
      type: "vaccination" as const,
    },
    {
      id: "act-3",
      title: "Microsuction Ear Care Completed",
      timestamp: "1 week ago",
      type: "completed" as const,
    },
  ];

  const notifications = rawNotifications.map((n: any) => ({
    id: n.id,
    title: n.title || "Notification",
    message: n.message || "",
    timestamp: n.createdAt
      ? new Date(n.createdAt).toLocaleDateString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : "Just now",
    read: n.isRead || false,
  }));

  return (
    <PatientCompanionView
      user={{
        firstName: profile.firstName || "Patient",
        lastName: profile.lastName || "",
        email: profile.email || "",
      }}
      nextAppointment={nextApp}
      upcomingAppointments={upcomingAppointments}
      recentActivity={recentActivity}
      notifications={notifications}
    />
  );
}

import { db } from "@/lib/db";
import { BookingsTable } from "./bookings-table";
import { H1, P } from "@/components/ui/typography";

import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminBookingsPage() {
  const session = await getRequiredSession();
  if (session.user.role === "platform_admin" && !session.user.canManageBookings) {
    redirect("/admin");
  }
  const bookings = await db.appointment.findMany({
    orderBy: { startTime: "desc" },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      pharmacy: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <H1>Platform Bookings</H1>
        <P className="mt-1">
          Review all scheduled slots, appointments, and diagnostic visits across the system.
        </P>
      </div>

      <BookingsTable data={bookings} role={session.user.role as "super_admin" | "platform_admin"} />
    </div>
  );
}

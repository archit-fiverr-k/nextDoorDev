import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

interface Props {
  params: { code: string };
}

export default async function ShortBookingRedirectPage({ params }: Props) {
  const codeParam = params.code.trim();

  let appointment: { id: string } | null = null;

  if (isUuid(codeParam)) {
    appointment = await db.appointment.findUnique({
      where: { id: codeParam },
      select: { id: true },
    });
  }

  if (!appointment) {
    const targetRef = codeParam.toUpperCase().replace(/^NDC-/, "");
    const recent = await db.appointment.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const match = recent.find(
      (a) => a.id.replace(/-/g, "").substring(0, 6).toUpperCase() === targetRef
    );
    if (match) appointment = match;
  }

  if (!appointment) {
    notFound();
  }

  redirect(`/patient/appointments/${appointment.id}`);
}

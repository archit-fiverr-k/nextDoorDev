import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PatientsClient from "./patients-client";

export const revalidate = 0;

interface PatientsPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PatientsPage({ params }: PatientsPageProps) {
  const isParamUuid = isUuid(params.tenantId);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
  });

  if (!pharmacy) {
    notFound();
  }

  const pharmacyId = pharmacy.id;

  // Fetch patients with appointments & crm notes for this pharmacy
  const patients = await db.customer.findMany({
    where: {
      OR: [{ pharmacyId }, { appointments: { some: { pharmacyId } } }],
    },
    include: {
      appointments: {
        where: { pharmacyId },
        include: {
          service: true,
        },
        orderBy: {
          startTime: "desc",
        },
      },
      crmNotes: {
        where: { pharmacyId },
        orderBy: {
          createdAt: "desc",
        },
      },
      communicationsLog: {
        where: { pharmacyId },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <PatientsClient
      pharmacyId={pharmacyId}
      initialPatients={JSON.parse(JSON.stringify(patients))}
    />
  );
}

import { db } from "@/lib/db";
import PatientsClient from "./patients-client";

export const revalidate = 0;

interface PatientsPageProps {
  params: {
    tenantId: string;
  };
}

export default async function PatientsPage({ params }: PatientsPageProps) {
  const pharmacyId = params.tenantId;

  // Fetch patients with appointments & crm notes
  const patients = await db.customer.findMany({
    where: {
      pharmacyId,
    },
    include: {
      appointments: {
        include: {
          service: true,
        },
        orderBy: {
          startTime: "desc",
        },
      },
      crmNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      communicationsLog: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <PatientsClient pharmacyId={pharmacyId} initialPatients={patients} />;
}

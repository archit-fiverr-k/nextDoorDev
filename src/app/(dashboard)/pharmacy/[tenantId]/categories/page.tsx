import { db } from "@/lib/db";
import CategoriesClient from "./categories-client";

export const revalidate = 0;

interface CategoriesPageProps {
  params: {
    tenantId: string;
  };
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const pharmacyId = params.tenantId;

  const categories = await db.category.findMany({
    where: {
      deleted: false,
    },
    include: {
      servicesService: {
        where: {
          pharmacyId,
        },
      },
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  return <CategoriesClient pharmacyId={pharmacyId} initialCategories={categories} />;
}

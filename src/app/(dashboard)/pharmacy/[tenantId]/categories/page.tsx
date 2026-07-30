import { redirect } from "next/navigation";

export default function PharmacyCategoriesPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}/services`);
}

import { redirect } from "next/navigation";

export default async function PharmacyBrandingPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}/profile`);
}

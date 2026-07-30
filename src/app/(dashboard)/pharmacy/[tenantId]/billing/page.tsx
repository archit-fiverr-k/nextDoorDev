import { redirect } from "next/navigation";

export default function BillingRedirectPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}/subscription`);
}

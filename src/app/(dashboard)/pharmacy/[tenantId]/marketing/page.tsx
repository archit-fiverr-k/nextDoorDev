import { redirect } from "next/navigation";

export default function MarketingRedirectPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}`);
}

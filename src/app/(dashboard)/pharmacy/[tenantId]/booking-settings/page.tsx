import { redirect } from "next/navigation";

export default function BookingSettingsRedirectPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}/settings`);
}

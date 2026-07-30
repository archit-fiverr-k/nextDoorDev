import { redirect } from "next/navigation";

export default function NotificationsRedirectPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}`);
}

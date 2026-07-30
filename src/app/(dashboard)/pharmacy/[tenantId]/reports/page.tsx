import { redirect } from "next/navigation";

export default function ReportsRedirectPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}`);
}

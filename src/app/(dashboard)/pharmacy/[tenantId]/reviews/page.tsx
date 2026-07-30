import { redirect } from "next/navigation";

export default function ReviewsRedirectPage({ params }: { params: { tenantId: string } }) {
  redirect(`/pharmacy/${params.tenantId}/profile`);
}

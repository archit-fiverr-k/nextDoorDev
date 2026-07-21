import { auth } from "@/lib/auth";
import { B2bLanding } from "@/components/shared/b2b-landing";

export const revalidate = 0; // Dynamic route

export default async function ForProvidersPage() {
  const session = await auth();
  return <B2bLanding user={session?.user as any} />;
}

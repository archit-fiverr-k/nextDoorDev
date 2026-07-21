import { auth } from "@/lib/auth";

export async function getSession() {
  return await auth();
}

export async function getRequiredSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Session required");
  }
  return session;
}

export async function assertRole(
  allowedRoles: ("super_admin" | "platform_admin" | "pharmacy" | "staff" | "patient")[]
) {
  const session = await getRequiredSession();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error(`Forbidden: Access restricted to roles: ${allowedRoles.join(", ")}`);
  }
  return session;
}

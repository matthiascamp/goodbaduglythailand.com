import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireMemberPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?redirect=/dashboard");
  if (session.user.membershipStatus !== "ACTIVE" && session.user.role !== "ADMIN") redirect("/membership");
  return session;
}

export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

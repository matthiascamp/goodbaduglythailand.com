import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in?redirect=/dashboard");
  }

  if (session.user.membershipStatus !== "ACTIVE" && session.user.role !== "ADMIN") {
    redirect("/membership");
  }

  return <>{children}</>;
}

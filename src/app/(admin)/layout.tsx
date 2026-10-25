import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminNav from "@/components/AdminNav";
import { db } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [comments, enquiries] = await Promise.all([
    db.comment.count({ where: { approved: false } }),
    db.serviceEnquiry.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="admin-shell min-h-screen">
      <div className="admin-frame editorial-container">
        <AdminNav counts={{ comments, enquiries }} />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

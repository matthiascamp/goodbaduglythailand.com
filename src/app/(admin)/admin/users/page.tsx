import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { requireAdminPage } from "@/lib/page-auth";

export const metadata: Metadata = {
  title: "User Management — Admin",
};

export default async function AdminUsersPage() {
  await requireAdminPage();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      membershipStatus: true,
      membershipPaidAt: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-charcoal">
          Users ({users.length})
        </h1>
      </div>

      <div className="bg-cream border border-gold/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark">
              <tr>
                <th className="text-left px-6 py-3 text-charcoal/60 font-medium">
                  Name / Email
                </th>
                <th className="text-left px-6 py-3 text-charcoal/60 font-medium">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-charcoal/60 font-medium">
                  Membership
                </th>
                <th className="text-left px-6 py-3 text-charcoal/60 font-medium">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-cream-dark/50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-charcoal">
                      {user.name ?? "—"}
                    </div>
                    <div className="text-charcoal/50 text-xs">{user.email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-burgundy/10 text-burgundy"
                          : "bg-charcoal/10 text-charcoal/60"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        user.membershipStatus === "ACTIVE"
                          ? "bg-emerald/10 text-emerald"
                          : "bg-charcoal/10 text-charcoal/50"
                      }`}
                    >
                      {user.membershipStatus}
                    </span>
                    {user.membershipPaidAt && (
                      <div className="text-xs text-charcoal/40 mt-0.5">
                        Paid {formatDate(user.membershipPaidAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-charcoal/60 text-xs">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

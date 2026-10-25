import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources", description: "Downloadable resources from the Good, Bad & Ugly Thailand library." };

export default async function ResourcesPage() {
  const [session, resources] = await Promise.all([
    auth(),
    db.resource.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const canAccessMembers = session?.user.role === "ADMIN" || session?.user.membershipStatus === "ACTIVE";
  return <div className="resources-page">
    <section className="resources-intro editorial-container"><p className="editorial-eyebrow">THE DOWNLOAD LIBRARY</p><h1>Keep the good stuff <em>close.</em></h1><p>Useful files for the journey, collected in one place. Public resources are open to everyone; member resources are included with the one-time membership.</p></section>
    <section className="resources-list editorial-container" aria-label="Downloadable resources">
      {resources.length === 0 ? <div className="resources-empty"><span>THE LIBRARY IS TAKING SHAPE</span><h2>Something useful is coming.</h2><p>Resources will appear here when they are published.</p><Link className="editorial-text-link" href="/articles">Read the journal ↗</Link></div> :
        resources.map((resource, index) => {
          const allowed = resource.access === "PUBLIC" || canAccessMembers;
          return <article key={resource.id} className="resources-row">
            <span className="editorial-index">{String(index + 1).padStart(2, "0")}</span>
            <div><span className="editorial-small-label">{resource.access === "PUBLIC" ? "OPEN RESOURCE" : "MEMBER RESOURCE"} · {resource.originalName.split(".").pop()?.toUpperCase() || "FILE"}</span><h2>{resource.title}</h2><p>{resource.description}</p><small>{(resource.sizeBytes / 1024 / 1024).toFixed(1)} MB</small></div>
            {allowed ? <a className="resources-action" href={`/api/resources/${resource.id}/download`}>Download ↗</a> : <Link className="resources-action" href="/membership">Explore membership ↗</Link>}
          </article>;
        })}
    </section>
  </div>;
}

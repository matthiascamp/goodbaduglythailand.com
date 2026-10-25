"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  approved: boolean;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  article: { title: string; slug: string };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/comments?status=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? []);
        setLoading(false);
      });
  }, [filter]);

  async function handleAction(
    commentId: string,
    action: "approve" | "delete"
  ) {
    setActionLoading(commentId);
    const res = await fetch(`/api/comments/${commentId}`, {
      method: action === "approve" ? "PATCH" : "DELETE",
      headers: { "Content-Type": "application/json" },
      ...(action === "approve"
        ? { body: JSON.stringify({ approved: true }) }
        : {}),
    });

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    setActionLoading(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-charcoal">
          Comment Moderation
        </h1>
        <div className="flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setLoading(true);
                setFilter(f);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize ${
                filter === f
                  ? "bg-charcoal text-cream"
                  : "bg-cream border border-gold/30 text-charcoal/70 hover:border-gold"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-charcoal/40 font-serif text-lg">
          Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">✓</div>
          <p className="font-serif text-lg text-charcoal/50">
            No {filter === "all" ? "" : filter} comments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-cream border border-gold/20 rounded-xl p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">
                    {(comment.user?.name ?? "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-charcoal">
                      {comment.user?.name ?? "Anonymous"}
                    </div>
                    <div className="text-xs text-charcoal/40">
                      {comment.user?.email} ·{" "}
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    comment.approved
                      ? "bg-emerald/10 text-emerald"
                      : "bg-gold/10 text-gold"
                  }`}
                >
                  {comment.approved ? "Approved" : "Pending"}
                </span>
              </div>

              {/* Article link */}
              <div className="text-xs text-charcoal/50 mb-2">
                On article:{" "}
                <a
                  href={`/articles/${comment.article.slug}`}
                  target="_blank"
                  className="text-gold hover:text-gold-dark"
                  rel="noopener noreferrer"
                >
                  {comment.article.title}
                </a>
              </div>

              {/* Comment text */}
              <p className="text-charcoal/80 text-sm leading-relaxed mb-4">
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                {!comment.approved && (
                  <button
                    onClick={() => handleAction(comment.id, "approve")}
                    disabled={actionLoading === comment.id}
                    className="bg-emerald hover:bg-emerald-light disabled:opacity-50 text-cream text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    {actionLoading === comment.id ? "…" : "Approve"}
                  </button>
                )}
                <button
                  onClick={() => handleAction(comment.id, "delete")}
                  disabled={actionLoading === comment.id}
                  className="bg-burgundy/10 hover:bg-burgundy/20 disabled:opacity-50 text-burgundy text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                >
                  {actionLoading === comment.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

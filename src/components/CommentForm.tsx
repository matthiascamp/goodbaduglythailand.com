"use client";

import { useState } from "react";

interface CommentFormProps {
  articleId: string;
}

export default function CommentForm({ articleId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, content: content.trim(), name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit comment");
      }

      setStatus("success");
      setContent("");
      setName("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-emerald/10 border border-emerald/30 rounded-xl p-6 text-center">
        <div className="text-emerald text-2xl mb-2">✓</div>
        <p className="text-emerald font-semibold">
          Comment submitted for review
        </p>
        <p className="text-charcoal/60 text-sm mt-1">
          Your comment will appear once approved.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-gold hover:text-gold-dark text-sm font-medium transition-colors"
        >
          Leave another comment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="comment-name"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Your name (optional)
        </label>
        <input
          id="comment-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Anonymous"
          className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-cream"
        />
      </div>

      <div>
        <label
          htmlFor="comment-content"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Comment <span className="text-burgundy">*</span>
        </label>
        <textarea
          id="comment-content"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, questions, or experience…"
          className="w-full border border-gold/30 rounded-lg px-4 py-2.5 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-cream resize-none"
        />
      </div>

      {status === "error" && (
        <div className="bg-burgundy/10 border border-burgundy/30 rounded-lg p-3 text-burgundy text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "loading" || !content.trim()}
          className="bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-charcoal font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          {status === "loading" ? "Submitting…" : "Submit Comment"}
        </button>
        <p className="text-charcoal/50 text-xs">
          Comments are reviewed before publication.
        </p>
      </div>
    </form>
  );
}

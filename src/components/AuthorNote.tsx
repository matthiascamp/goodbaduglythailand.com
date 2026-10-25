import Link from "next/link";
import { EXPERIENCE_STATEMENT } from "@/lib/plan-services";

/** Restrained credibility note. Uses only the owner-provided fact; no name, story or testimonial. */
export default function AuthorNote() {
  return (
    <aside className="author-note" aria-label="About the author">
      <p>
        <strong>About the author.</strong> {EXPERIENCE_STATEMENT} This is lived experience, not professional accreditation.{" "}
        <Link href="/about#author">More about the author</Link>
      </p>
    </aside>
  );
}

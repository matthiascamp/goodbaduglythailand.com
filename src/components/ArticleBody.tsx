import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  );
}

/** The same small, safe text format is used in the editor and on published pages. */
export default function ArticleBody({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/).filter(Boolean);

  return <div className="article-body">
    {blocks.map((block, index) => {
      const lines = block.split("\n");
      if (lines.length === 1 && block.startsWith("### ")) {
        return <h3 key={index}>{inline(block.slice(4))}</h3>;
      }
      if (lines.length === 1 && block.startsWith("## ")) {
        return <h2 key={index}>{inline(block.slice(3))}</h2>;
      }
      if (lines.every((line) => line.startsWith("- "))) {
        return <ul key={index}>{lines.map((line, lineIndex) => <li key={lineIndex}>{inline(line.slice(2))}</li>)}</ul>;
      }
      return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{inline(line)}</span>)}</p>;
    })}
  </div>;
}

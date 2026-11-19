import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { parseRichText, renderMath } from "@/lib/rich-text/parse";

/** Renders plain text (line breaks preserved) + KaTeX math. Works in server and client components. */
export function RichText({ text, className, as: Tag = "div" }: { text: string; className?: string; as?: "div" | "span" }) {
  const segments = parseRichText(text ?? "");
  return (
    <Tag className={cn("rich-content whitespace-pre-wrap", className)}>
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <Fragment key={i}>{s.value}</Fragment>
        ) : (
          // KaTeX output only (trust:false); user text never reaches innerHTML.
          <span key={i} className={s.display ? "block" : undefined} dangerouslySetInnerHTML={{ __html: renderMath(s.value, s.display) }} />
        ),
      )}
    </Tag>
  );
}

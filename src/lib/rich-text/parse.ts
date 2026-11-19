import katex from "katex";

/**
 * Safe rich content: plain text + LaTeX between `$...$` (inline) or `$$...$$` (display).
 * `\$` is a literal dollar. User text is NEVER interpreted as HTML: text segments are rendered
 * as React text nodes; only KaTeX's own output (trust:false, no \href/\url/\html*) is injected.
 */
export type RichSegment = { kind: "text"; value: string } | { kind: "math"; value: string; display: boolean };

export function parseRichText(input: string): RichSegment[] {
  const out: RichSegment[] = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) out.push({ kind: "text", value: buf });
    buf = "";
  };
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\" && input[i + 1] === "$") {
      buf += "$";
      i += 2;
      continue;
    }
    if (ch === "$") {
      const display = input[i + 1] === "$";
      const delim = display ? "$$" : "$";
      const start = i + delim.length;
      let j = start;
      let end = -1;
      while (j < input.length) {
        if (input[j] === "\\") {
          j += 2;
          continue;
        }
        if (input.startsWith(delim, j)) {
          end = j;
          break;
        }
        j++;
      }
      if (end > start) {
        flush();
        out.push({ kind: "math", value: input.slice(start, end), display });
        i = end + delim.length;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

const KATEX_OPTIONS = { trust: false, strict: "ignore", maxSize: 20, maxExpand: 500, output: "htmlAndMathml" } as const;

export function renderMath(expr: string, display: boolean): string {
  return katex.renderToString(expr, { ...KATEX_OPTIONS, displayMode: display, throwOnError: false, errorColor: "#b91c1c" });
}

/** List LaTeX errors for editor feedback (Vietnamese prefix, KaTeX detail). */
export function findLatexErrors(input: string): string[] {
  const errs: string[] = [];
  for (const seg of parseRichText(input)) {
    if (seg.kind !== "math") continue;
    try {
      katex.renderToString(seg.value, { ...KATEX_OPTIONS, displayMode: seg.display, throwOnError: true });
    } catch (e) {
      errs.push(`Lỗi công thức "${seg.value.slice(0, 40)}": ${e instanceof Error ? e.message.replace(/^KaTeX parse error: /, "") : "không hợp lệ"}`);
    }
  }
  const dollars = (input.replace(/\\\$/g, "").match(/\$/g) ?? []).length;
  if (dollars % 2 === 1) errs.push("Thiếu dấu $ đóng công thức.");
  return errs;
}

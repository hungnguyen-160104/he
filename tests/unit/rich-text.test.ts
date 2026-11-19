import { describe, expect, it } from "vitest";
import { findLatexErrors, parseRichText, renderMath } from "@/lib/rich-text/parse";

describe("rich text", () => {
  it("splits text, inline and display math; supports escaped dollars", () => {
    expect(parseRichText("Giá \\$5, tính $x^2$ và $$\\int_0^1 x\\,dx$$ xong")).toEqual([
      { kind: "text", value: "Giá $5, tính " },
      { kind: "math", value: "x^2", display: false },
      { kind: "text", value: " và " },
      { kind: "math", value: "\\int_0^1 x\\,dx", display: true },
      { kind: "text", value: " xong" },
    ]);
  });
  it("unclosed $ stays text", () => {
    expect(parseRichText("a $b")).toEqual([{ kind: "text", value: "a $b" }]);
  });
  it("HTML in text is never parsed as math/markup", () => {
    const segs = parseRichText("<img src=x onerror=alert(1)>");
    expect(segs).toEqual([{ kind: "text", value: "<img src=x onerror=alert(1)>" }]);
  });
  it("KaTeX does not allow \\href / raw HTML (trust:false)", () => {
    const html = renderMath("\\href{javascript:alert(1)}{x}", false);
    // The source may appear escaped inside <annotation>, but never as a link/attribute.
    expect(html).not.toMatch(/<a\s|href=/i);
    const html2 = renderMath("\\htmlId{x}{y}", false);
    expect(html2).not.toContain('id="x"');
  });
  it("reports LaTeX errors in Vietnamese", () => {
    expect(findLatexErrors("$\\frac{1}{$")).not.toHaveLength(0);
    expect(findLatexErrors("thiếu $x")).toContain("Thiếu dấu $ đóng công thức.");
    expect(findLatexErrors("$\\frac{1}{2}$")).toEqual([]);
  });
});

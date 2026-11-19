import { RichText } from "@/components/content/rich-text";

/** Shows a question's correct answer. Only render in contexts the server authorized. */
export function AnswerKey({ type, answer }: { type: string; answer: unknown }) {
  if (!answer || typeof answer !== "object") return <p className="text-sm text-muted-foreground">Không có đáp án.</p>;
  const a = answer as Record<string, unknown>;
  const missing = <span className="text-muted-foreground">chưa chọn</span>;
  if (type === "SINGLE_CHOICE") {
    return <p className="text-sm">Đáp án đúng: <strong>{typeof a.correctOptionId === "string" ? a.correctOptionId : missing}</strong></p>;
  }
  if (type === "TRUE_FALSE") {
    const v = (a.values ?? {}) as Record<string, boolean | null | undefined>;
    return (
      <p className="text-sm">
        Đáp án:{" "}
        {(["a", "b", "c", "d"] as const).map((k) => (
          <span key={k} className="mr-3">
            {k}) <strong>{v[k] === true ? "Đúng" : v[k] === false ? "Sai" : missing}</strong>
          </span>
        ))}
      </p>
    );
  }
  const accepted = Array.isArray(a.acceptedAnswers) ? (a.acceptedAnswers as string[]) : [];
  if (!accepted.length) return <p className="text-sm">Đáp án chấp nhận: {missing}</p>;
  return (
    <p className="text-sm">
      Đáp án chấp nhận: <strong>{accepted.join(" ; ")}</strong>
      {a.tolerance ? <> (sai số ±{String(a.tolerance)})</> : null}
    </p>
  );
}

export function Explanation({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="rounded-md border border-primary/20 bg-accent/50 p-3 text-sm">
      <p className="mb-1 font-medium">Lời giải</p>
      <RichText text={text} />
    </div>
  );
}

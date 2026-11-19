import Decimal from "decimal.js";

/**
 * SHORT_ANSWER normalization (pure, client-safe).
 * NUMBER: trims, removes inner spaces, accepts ONE decimal separator ("," or "."), optional sign.
 *   "1,5" → 1.5 ; "15" stays 15 (never confused with 1,5) ; "1.000,5" / "1,000.5" are rejected as
 *   ambiguous ; no expression evaluation, no exponent notation.
 * TEXT: trims, collapses whitespace, NFC; case-insensitive unless configured.
 */
export type ShortAnswerType = "NUMBER" | "TEXT";

const NUMBER_RE = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;

export function parseNumberAnswer(raw: string): Decimal | null {
  if (typeof raw !== "string") return null;
  const compact = raw.normalize("NFKC").trim().replace(/\s+/g, "").replace(/[−–]/g, "-");
  if (!compact || compact.length > 40 || !NUMBER_RE.test(compact)) return null;
  try {
    const d = new Decimal(compact.replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

export function normalizeTextAnswer(raw: string, caseSensitive = false): string {
  const s = raw.normalize("NFC").trim().replace(/\s+/g, " ");
  return caseSensitive ? s : s.toLocaleLowerCase("vi");
}

export type ShortAnswerKey = {
  answerType: ShortAnswerType;
  acceptedAnswers: string[];
  /** NUMBER only: absolute tolerance as a decimal string (e.g. "0.01"); applied only when set. */
  tolerance?: string | null;
  /** TEXT only. */
  caseSensitive?: boolean;
};

export function isShortAnswerCorrect(response: string | null | undefined, key: ShortAnswerKey): boolean {
  if (response === null || response === undefined || response.trim() === "") return false;
  if (key.answerType === "NUMBER") {
    const value = parseNumberAnswer(response);
    if (!value) return false;
    const tol = key.tolerance ? new Decimal(key.tolerance) : null;
    return key.acceptedAnswers.some((a) => {
      const target = parseNumberAnswer(a);
      if (!target) return false;
      return tol ? value.minus(target).abs().lte(tol) : value.eq(target);
    });
  }
  const norm = normalizeTextAnswer(response, key.caseSensitive);
  return key.acceptedAnswers.some((a) => normalizeTextAnswer(a, key.caseSensitive) === norm);
}

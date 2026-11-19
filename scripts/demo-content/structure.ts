/**
 * Number of questions per part and duration of each DEMO exam, following the structure of the THPT
 * graduation exam from 2025 (Bộ GD&ĐT). Every exam totals 10 points:
 *   I   = 0.25 point per question
 *   II  = 4 statements per question: 0.1 / 0.25 / 0.5 / 1 point for 1 / 2 / 3 / 4 correct
 *   III = 0.5 point (Toán) or 0.25 point (other subjects)
 * Ngữ văn (essay-only) is not included: the system has no essay question type.
 */
export const EXPECTED_STRUCTURE: Record<string, { I: number; II: number; III: number; minutes: number }> = {
  toan: { I: 12, II: 4, III: 6, minutes: 90 },
  "vat-li": { I: 18, II: 4, III: 6, minutes: 50 },
  "hoa-hoc": { I: 18, II: 4, III: 6, minutes: 50 },
  "sinh-hoc": { I: 18, II: 4, III: 6, minutes: 50 },
  "dia-li": { I: 18, II: 4, III: 6, minutes: 50 },
  "lich-su": { I: 24, II: 4, III: 0, minutes: 50 },
  gdktpl: { I: 24, II: 4, III: 0, minutes: 50 },
  "tin-hoc": { I: 24, II: 4, III: 0, minutes: 50 },
  "cong-nghe-cong-nghiep": { I: 24, II: 4, III: 0, minutes: 50 },
  "cong-nghe-nong-nghiep": { I: 24, II: 4, III: 0, minutes: 50 },
  "tieng-anh": { I: 40, II: 0, III: 0, minutes: 50 },
};

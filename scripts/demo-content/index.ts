/**
 * All DEMO exams seeded by `pnpm seed:demo` (default profile): one full mock exam per subject in the
 * THPT graduation exam format from 2025. Counts per part live in ./structure.ts.
 */
import type { DemoExam } from "./builders";
import { THPT_2025_DEMO_EXAMS } from "./thpt-2025";
import { SINH_HOC_EXAM } from "./sinh-hoc";
import { DIA_LI_EXAM } from "./dia-li";
import { LICH_SU_EXAM } from "./lich-su";
import { GDKTPL_EXAM } from "./gdktpl";
import { TIN_HOC_EXAM } from "./tin-hoc";
import { CN_CONG_NGHIEP_EXAM } from "./cong-nghe-cong-nghiep";
import { CN_NONG_NGHIEP_EXAM } from "./cong-nghe-nong-nghiep";
import { TIENG_ANH_EXAM } from "./tieng-anh";

export type { DemoExam, DemoQuestion } from "./builders";

export const DEMO_EXAMS: DemoExam[] = [
  ...THPT_2025_DEMO_EXAMS,
  SINH_HOC_EXAM,
  LICH_SU_EXAM,
  DIA_LI_EXAM,
  GDKTPL_EXAM,
  TIN_HOC_EXAM,
  CN_CONG_NGHIEP_EXAM,
  CN_NONG_NGHIEP_EXAM,
  TIENG_ANH_EXAM,
];

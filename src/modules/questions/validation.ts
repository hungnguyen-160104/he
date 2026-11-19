import { z } from "zod";
import { objectIdSchema } from "@/lib/validation/common";
import { parseNumberAnswer } from "@/modules/grading/short-answer";
import { DIFFICULTIES, OPTION_IDS, STATEMENT_IDS } from "./types";

/** Client-safe schemas for question editing (shared by editor form and API). */
export const richTextSchema = (max: number, label: string) =>
  z.string().trim().max(max, `${label} tối đa ${max} ký tự`);

export const mediaRefSchema = z
  .object({
    publicId: z.string().min(1).max(200).regex(/^[A-Za-z0-9_\-/]+$/, "publicId không hợp lệ"),
    secureUrl: z.url().max(500).startsWith("https://res.cloudinary.com/", "Ảnh phải được lưu trên Cloudinary của hệ thống"),
    width: z.number().int().min(1).max(10_000),
    height: z.number().int().min(1).max(10_000),
    format: z.enum(["jpg", "jpeg", "png", "webp"]),
    bytes: z.number().int().min(1).max(3 * 1024 * 1024),
    alt: z.string().trim().min(1, "Vui lòng mô tả ảnh (alt) để hỗ trợ người khiếm thị").max(200),
  })
  .strict();
export type MediaRef = z.infer<typeof mediaRefSchema>;

const stemSchema = richTextSchema(5000, "Đề bài").min(1, "Vui lòng nhập đề bài");
const explanationSchema = richTextSchema(5000, "Lời giải").default("");
const mediaListSchema = z.array(mediaRefSchema).max(3, "Tối đa 3 ảnh mỗi câu").default([]);

const optionSchema = z.object({ id: z.enum(OPTION_IDS), text: richTextSchema(1000, "Phương án").min(1, "Vui lòng nhập nội dung phương án") }).strict();
const statementSchema = z.object({ id: z.enum(STATEMENT_IDS), text: richTextSchema(1000, "Ý").min(1, "Vui lòng nhập nội dung ý") }).strict();

function exactIds<T extends { id: string }>(items: T[], ids: readonly string[]) {
  return items.length === ids.length && ids.every((id, i) => items[i]?.id === id);
}

export const singleChoiceSchema = z
  .object({
    type: z.literal("SINGLE_CHOICE"),
    content: z
      .object({
        stem: stemSchema,
        options: z.array(optionSchema).refine((o) => exactIds(o, OPTION_IDS), "Cần đúng 4 phương án A, B, C, D theo thứ tự"),
        media: mediaListSchema,
      })
      .strict(),
    key: z.object({ correctOptionId: z.enum(OPTION_IDS, { error: "Vui lòng chọn đáp án đúng" }) }).strict(),
    explanation: explanationSchema,
  })
  .strict();

export const trueFalseSchema = z
  .object({
    type: z.literal("TRUE_FALSE"),
    content: z
      .object({
        stem: stemSchema,
        statements: z.array(statementSchema).refine((s) => exactIds(s, STATEMENT_IDS), "Cần đúng 4 ý a, b, c, d theo thứ tự"),
        media: mediaListSchema,
      })
      .strict(),
    key: z
      .object({
        values: z.object({ a: z.boolean(), b: z.boolean(), c: z.boolean(), d: z.boolean() }, { error: "Vui lòng chọn Đúng/Sai cho cả 4 ý" }).strict(),
      })
      .strict(),
    explanation: explanationSchema,
  })
  .strict();

export const shortAnswerKeySchema = z
  .object({
    answerType: z.enum(["NUMBER", "TEXT"]),
    acceptedAnswers: z.array(z.string().trim().min(1).max(100)).min(1, "Cần ít nhất 1 đáp án chấp nhận").max(10),
    tolerance: z
      .string()
      .trim()
      .max(20)
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    caseSensitive: z.boolean().default(false),
  })
  .strict()
  .superRefine((k, ctx) => {
    if (k.answerType === "NUMBER") {
      k.acceptedAnswers.forEach((a, i) => {
        if (!parseNumberAnswer(a)) ctx.addIssue({ code: "custom", path: ["acceptedAnswers", i], message: `"${a}" không phải số hợp lệ (dùng 1,5 hoặc 1.5)` });
      });
      if (k.tolerance) {
        const t = parseNumberAnswer(k.tolerance);
        if (!t || t.isNegative()) ctx.addIssue({ code: "custom", path: ["tolerance"], message: "Sai số cho phép phải là số không âm" });
      }
    } else if (k.tolerance) {
      ctx.addIssue({ code: "custom", path: ["tolerance"], message: "Sai số chỉ áp dụng cho đáp án dạng số" });
    }
  });

export const shortAnswerSchema = z
  .object({
    type: z.literal("SHORT_ANSWER"),
    content: z.object({ stem: stemSchema, media: mediaListSchema }).strict(),
    key: shortAnswerKeySchema,
    explanation: explanationSchema,
  })
  .strict();

export const questionBodySchema = z.discriminatedUnion("type", [singleChoiceSchema, trueFalseSchema, shortAnswerSchema]);
export type QuestionBody = z.infer<typeof questionBodySchema>;

export const questionMetaSchema = z
  .object({
    subjectId: objectIdSchema,
    topicIds: z.array(objectIdSchema).max(5, "Tối đa 5 chủ đề").default([]),
    difficulty: z.enum(DIFFICULTIES),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  })
  .strict();

/** Full create/update payload: { meta, body }. */
export const questionInputSchema = z.object({ meta: questionMetaSchema, body: questionBodySchema }).strict();
export type QuestionInput = z.input<typeof questionInputSchema>;
export type QuestionInputParsed = z.output<typeof questionInputSchema>;

export const rejectSchema = z.object({ reason: z.string().trim().min(5, "Vui lòng nêu lý do (ít nhất 5 ký tự)").max(1000) }).strict();

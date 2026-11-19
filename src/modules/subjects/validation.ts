import { z } from "zod";
import { objectIdSchema } from "@/lib/validation/common";
import { QUESTION_TYPES } from "@/modules/questions/types";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug cần từ 2 ký tự")
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm a-z, 0-9 và dấu - (ví dụ: vat-li)");

export const subjectInputSchema = z
  .object({
    name: z.string().trim().min(2, "Tên môn cần từ 2 ký tự").max(80),
    slug: slugSchema,
    code: z.string().trim().toUpperCase().min(2).max(12).regex(/^[A-Z0-9_]+$/, "Mã môn chỉ gồm A-Z, 0-9, _"),
    allowedQuestionTypes: z.array(z.enum(QUESTION_TYPES)).min(1, "Chọn ít nhất 1 dạng câu hỏi"),
    examYearsSupported: z.array(z.number().int().min(2020).max(2100)).max(20).default([]),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .strict();
export type SubjectInput = z.input<typeof subjectInputSchema>;
export const subjectPatchSchema = subjectInputSchema.partial().strict();

export const topicInputSchema = z
  .object({
    subjectId: objectIdSchema,
    parentId: objectIdSchema.nullable().default(null),
    name: z.string().trim().min(2, "Tên chủ đề cần từ 2 ký tự").max(120),
    slug: slugSchema,
    grade: z.union([z.literal(10), z.literal(11), z.literal(12), z.null()]).default(null),
    sortOrder: z.number().int().min(0).max(1000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();
export type TopicInput = z.input<typeof topicInputSchema>;
export const topicPatchSchema = topicInputSchema.omit({ subjectId: true, parentId: true }).partial().strict();

/** Vietnamese → ASCII slug helper for forms. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

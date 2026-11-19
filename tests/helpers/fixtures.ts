import { SubjectModel, TopicModel } from "@/modules/subjects/model";
import type { QuestionInput } from "@/modules/questions/validation";

export async function createSubjectFixture(slug = "toan", types: ("SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER")[] = ["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]) {
  const s = await SubjectModel.create({ name: `Môn ${slug}`, slug, code: slug.toUpperCase().replace(/-/g, "_"), allowedQuestionTypes: types });
  const t = await TopicModel.create({ subjectId: s._id, name: `Chủ đề ${slug}`, slug: `cd-${slug}` });
  return { subjectId: String(s._id), topicId: String(t._id) };
}

export function scInput(subjectId: string, topicIds: string[] = [], stem = "Giá trị của $2+3$ là?", correct: "A" | "B" | "C" | "D" = "B"): QuestionInput {
  return {
    meta: { subjectId, topicIds, difficulty: "EASY", tags: [] },
    body: {
      type: "SINGLE_CHOICE",
      content: {
        stem,
        options: [
          { id: "A", text: "4" },
          { id: "B", text: "5" },
          { id: "C", text: "6" },
          { id: "D", text: "7" },
        ],
        media: [],
      },
      key: { correctOptionId: correct },
      explanation: "Vì $2+3=5$.",
    },
  };
}

export function tfInput(subjectId: string, values = { a: true, b: false, c: true, d: false }): QuestionInput {
  return {
    meta: { subjectId, topicIds: [], difficulty: "MEDIUM", tags: [] },
    body: {
      type: "TRUE_FALSE",
      content: {
        stem: "Xét hàm số $y=x^2$.",
        statements: [
          { id: "a", text: "Hàm số chẵn." },
          { id: "b", text: "Hàm số đồng biến trên R." },
          { id: "c", text: "Đồ thị đi qua gốc tọa độ." },
          { id: "d", text: "Giá trị nhỏ nhất bằng 1." },
        ],
        media: [],
      },
      key: { values },
      explanation: "Giải thích DEMO.",
    },
  };
}

export function saInput(subjectId: string, accepted = ["1,5"], tolerance: string | null = null): QuestionInput {
  return {
    meta: { subjectId, topicIds: [], difficulty: "HARD", tags: [] },
    body: {
      type: "SHORT_ANSWER",
      content: { stem: "Tính $3/2$.", media: [] },
      key: { answerType: "NUMBER", acceptedAnswers: accepted, tolerance, caseSensitive: false },
      explanation: "$3/2=1,5$",
    },
  };
}

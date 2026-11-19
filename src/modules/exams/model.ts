import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DIFFICULTIES, QUESTION_TYPES } from "@/modules/questions/types";
import { EXAM_MODES, EXAM_STATUSES, RELEASE_POLICIES } from "./validation";

// ───────── scoring_rules ─────────
const scoringRuleSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    examYear: { type: Number, required: true },
    version: { type: Number, required: true },
    sections: {
      type: [new Schema({ id: String, title: String, questionType: { type: String, enum: QUESTION_TYPES } }, { _id: false })],
      default: [],
    },
    typeRules: { type: Schema.Types.Mixed, required: true },
    maxScore: { type: Number, default: 10 },
    roundingPolicy: { type: String, default: "HALF_UP_SCALED_10000" },
    status: { type: String, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], default: "DRAFT" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "scoring_rules", minimize: false },
);
scoringRuleSchema.index({ subjectId: 1, examYear: 1, version: 1 }, { unique: true });
scoringRuleSchema.index({ subjectId: 1, status: 1 });

export type ScoringRuleSchema = InferSchemaType<typeof scoringRuleSchema>;
export const ScoringRuleModel: Model<ScoringRuleSchema> =
  (models.ScoringRule as Model<ScoringRuleSchema> | undefined) ?? model<ScoringRuleSchema>("ScoringRule", scoringRuleSchema);

// ───────── exams ─────────
const examItemSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  questionVersionId: { type: Schema.Types.ObjectId, ref: "QuestionVersion", required: true },
  type: { type: String, enum: QUESTION_TYPES, required: true },
  sectionId: { type: String, default: null },
  position: { type: Number, required: true },
  maxPoints: { type: String, required: true },
});

const examSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 150 },
    description: { type: String, default: "" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    examYear: { type: Number, required: true },
    mode: { type: String, enum: EXAM_MODES, required: true },
    difficulty: { type: String, enum: [...DIFFICULTIES, null], default: null },
    durationMinutes: { type: Number, default: null },
    items: { type: [examItemSchema], default: [] },
    scoringRuleId: { type: Schema.Types.ObjectId, ref: "ScoringRule", required: true },
    totalMaxRawPoints: { type: String, default: "0" },
    publishStatus: { type: String, enum: EXAM_STATUSES, default: "DRAFT" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewNotes: { type: String, default: null },
    publishedAt: { type: Date, default: null },
    resultReleasePolicy: { type: String, enum: RELEASE_POLICIES, default: "AFTER_SUBMISSION" },
    resultsReleasedAt: { type: Date, default: null },
    clonedFrom: { type: Schema.Types.ObjectId, ref: "Exam", default: null },
    attemptCount: { type: Number, default: 0 },
    revision: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "exams" },
);
examSchema.index({ subjectId: 1, publishStatus: 1, mode: 1, publishedAt: -1 });
examSchema.index({ ownerId: 1, publishStatus: 1, updatedAt: -1 });
examSchema.index({ "items.questionVersionId": 1 });

export type ExamSchema = InferSchemaType<typeof examSchema>;
export const ExamModel: Model<ExamSchema> = (models.Exam as Model<ExamSchema> | undefined) ?? model<ExamSchema>("Exam", examSchema);

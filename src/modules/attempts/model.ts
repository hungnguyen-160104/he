import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { QUESTION_TYPES } from "@/modules/questions/types";
import { ATTEMPT_STATUSES } from "./validation";

/** Frozen snapshot of exam items at start time (refs only — never answer keys). */
const snapshotItemSchema = new Schema(
  {
    itemId: { type: String, required: true },
    questionId: { type: Schema.Types.ObjectId, required: true },
    questionVersionId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    sectionId: { type: String, default: null },
    position: { type: Number, required: true },
    maxPoints: { type: String, required: true },
  },
  { _id: false },
);

const attemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userRole: { type: String, required: true },
    kind: { type: String, enum: ["EXAM", "PRACTICE"], required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", default: null },
    examRevision: { type: Number, default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    mode: { type: String, enum: ["PRACTICE", "MOCK"], required: true },
    scoringRuleId: { type: Schema.Types.ObjectId, ref: "ScoringRule", required: true },
    typeRules: { type: Schema.Types.Mixed, required: true },
    sections: { type: [new Schema({ id: String, title: String, questionType: String }, { _id: false })], default: [] },
    items: { type: [snapshotItemSchema], required: true },
    resultReleasePolicy: { type: String, default: "AFTER_SUBMISSION" },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    finalizeReason: { type: String, enum: ["SUBMITTED", "EXPIRED", "RECONCILED", null], default: null },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: "IN_PROGRESS" },
    /** itemId → response; keys are validated 24-hex ids. */
    answers: { type: Schema.Types.Mixed, default: {} },
    marked: { type: [String], default: [] },
    revision: { type: Number, required: true, default: 0 },
    gradeResult: { type: Schema.Types.Mixed, default: null },
    scoreScaled: { type: Number, default: null },
    maxScoreScaled: { type: Number, default: 10_000 },
    isFirstRankedAttempt: { type: Boolean, default: false },
    /** First attempt by an ACTIVE STUDENT — the only kind that can count in rankings. */
    rankEligible: { type: Boolean, default: false },
    rankingCampaignIds: { type: [Schema.Types.ObjectId], default: [] },
    idempotencyKey: { type: String, default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "attempts", minimize: false },
);
attemptSchema.index({ userId: 1, examId: 1, startedAt: -1 });
attemptSchema.index({ userId: 1, status: 1, startedAt: -1 });
attemptSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });
attemptSchema.index({ status: 1, expiresAt: 1 });
attemptSchema.index({ examId: 1, rankEligible: 1, startedAt: 1 });

export type AttemptSchema = InferSchemaType<typeof attemptSchema>;
export const AttemptModel: Model<AttemptSchema> = (models.Attempt as Model<AttemptSchema> | undefined) ?? model<AttemptSchema>("Attempt", attemptSchema);

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    firstAttemptId: { type: Schema.Types.ObjectId, ref: "Attempt", required: true },
    firstStartedAt: { type: Date, required: true },
    attemptCount: { type: Number, default: 0 },
    lastAttemptId: { type: Schema.Types.ObjectId, ref: "Attempt", default: null },
  },
  { timestamps: true, collection: "user_exam_progress" },
);
progressSchema.index({ userId: 1, examId: 1 }, { unique: true });

export type ProgressSchema = InferSchemaType<typeof progressSchema>;
export const UserExamProgressModel: Model<ProgressSchema> =
  (models.UserExamProgress as Model<ProgressSchema> | undefined) ?? model<ProgressSchema>("UserExamProgress", progressSchema);

import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DIFFICULTIES, QUESTION_STATUSES, QUESTION_TYPES } from "./types";

const questionSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    topicIds: { type: [{ type: Schema.Types.ObjectId, ref: "Topic" }], default: [] },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: QUESTION_STATUSES, required: true, default: "DRAFT" },
    latestVersionId: { type: Schema.Types.ObjectId, ref: "QuestionVersion", default: null },
    publishedVersionId: { type: Schema.Types.ObjectId, ref: "QuestionVersion", default: null },
    tags: { type: [String], default: [] },
    searchText: { type: String, default: "" },
    reviewNotes: { type: String, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    revision: { type: Number, required: true, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "questions" },
);
questionSchema.index({ subjectId: 1, status: 1, type: 1, difficulty: 1 });
questionSchema.index({ ownerId: 1, status: 1, updatedAt: -1 });
questionSchema.index({ topicIds: 1, status: 1 });

export type QuestionSchema = InferSchemaType<typeof questionSchema>;
export const QuestionModel: Model<QuestionSchema> =
  (models.Question as Model<QuestionSchema> | undefined) ?? model<QuestionSchema>("Question", questionSchema);

const mediaSchema = new Schema(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true },
    alt: { type: String, required: true },
    resourceType: { type: String, default: "image" },
  },
  { _id: false },
);

/**
 * `content` shape per type (validated by Zod before persisting):
 *   SINGLE_CHOICE: { stem, options: [{id:"A".."D", text}] }
 *   TRUE_FALSE:    { stem, statements: [{id:"a".."d", text}] }
 *   SHORT_ANSWER:  { stem }
 * Answer keys are NEVER stored here (see question_keys).
 */
const questionVersionSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    versionNumber: { type: Number, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    media: { type: [mediaSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contentHash: { type: String, default: null },
    isImmutable: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: "question_versions", minimize: false },
);
questionVersionSchema.index({ questionId: 1, versionNumber: 1 }, { unique: true });
questionVersionSchema.index({ "media.publicId": 1 });

export type QuestionVersionSchema = InferSchemaType<typeof questionVersionSchema>;
export const QuestionVersionModel: Model<QuestionVersionSchema> =
  (models.QuestionVersion as Model<QuestionVersionSchema> | undefined) ?? model<QuestionVersionSchema>("QuestionVersion", questionVersionSchema);

/**
 * Private answer data. Only grader + authorized editor services read this collection.
 *   SINGLE_CHOICE: { correctOptionId }
 *   TRUE_FALSE:    { values: { a,b,c,d: boolean } }
 *   SHORT_ANSWER:  { answerType, acceptedAnswers[], tolerance, caseSensitive }
 */
const questionKeySchema = new Schema(
  {
    questionVersionId: { type: Schema.Types.ObjectId, ref: "QuestionVersion", required: true },
    answerData: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String, default: "" },
    gradingConfig: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "question_keys", minimize: false },
);
questionKeySchema.index({ questionVersionId: 1 }, { unique: true });

export type QuestionKeySchema = InferSchemaType<typeof questionKeySchema>;
export const QuestionKeyModel: Model<QuestionKeySchema> =
  (models.QuestionKey as Model<QuestionKeySchema> | undefined) ?? model<QuestionKeySchema>("QuestionKey", questionKeySchema);

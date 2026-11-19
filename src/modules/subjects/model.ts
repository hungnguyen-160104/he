import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { QUESTION_TYPES } from "@/modules/questions/types";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 60 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 12 },
    allowedQuestionTypes: { type: [{ type: String, enum: QUESTION_TYPES }], default: [] },
    examYearsSupported: { type: [Number], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "subjects" },
);
subjectSchema.index({ slug: 1 }, { unique: true });
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ isActive: 1, sortOrder: 1 });

export type SubjectSchema = InferSchemaType<typeof subjectSchema>;
export const SubjectModel: Model<SubjectSchema> =
  (models.Subject as Model<SubjectSchema> | undefined) ?? model<SubjectSchema>("Subject", subjectSchema);

const topicSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 60 },
    grade: { type: Number, enum: [10, 11, 12, null], default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "topics" },
);
topicSchema.index({ subjectId: 1, parentId: 1, slug: 1 }, { unique: true });
topicSchema.index({ subjectId: 1, sortOrder: 1 });

export type TopicSchema = InferSchemaType<typeof topicSchema>;
export const TopicModel: Model<TopicSchema> = (models.Topic as Model<TopicSchema> | undefined) ?? model<TopicSchema>("Topic", topicSchema);

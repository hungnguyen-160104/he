import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PERIOD_TYPES } from "@/lib/utils/period";

export const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"] as const;

const campaignSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 150 },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    periodType: { type: String, enum: PERIOD_TYPES, required: true },
    periodStartAt: { type: Date, required: true },
    periodEndAt: { type: Date, required: true },
    timezone: { type: String, default: "Asia/Ho_Chi_Minh" },
    examIds: { type: [{ type: Schema.Types.ObjectId, ref: "Exam" }], default: [] },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "DRAFT" },
    minimumCompletion: { type: String, default: "ALL" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    activatedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    calculationVersion: { type: Number, default: 1 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "ranking_campaigns" },
);
campaignSchema.index({ subjectId: 1, periodType: 1, periodStartAt: -1 });
campaignSchema.index({ examIds: 1, status: 1 });

export type CampaignSchema = InferSchemaType<typeof campaignSchema>;
export const RankingCampaignModel: Model<CampaignSchema> =
  (models.RankingCampaign as Model<CampaignSchema> | undefined) ?? model<CampaignSchema>("RankingCampaign", campaignSchema);

/** One document per entry of a FINAL snapshot (never hits the 16 MB document limit). Immutable. */
const snapshotSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "RankingCampaign", required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    periodType: { type: String, enum: PERIOD_TYPES, required: true },
    generatedAt: { type: Date, required: true },
    isFinal: { type: Boolean, default: true },
    calculationVersion: { type: Number, default: 1 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    displayNameSnapshot: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    scoreAverageScaled: { type: Number, required: true },
    scoreSumScaled: { type: Number, required: true },
    completedCount: { type: Number, required: true },
    correctCount: { type: Number, default: 0 },
    completedAt: { type: Date, required: true },
    rank: { type: Number, required: true },
  },
  { collection: "ranking_snapshots", versionKey: false },
);
snapshotSchema.index({ campaignId: 1, rank: 1 });
snapshotSchema.index({ campaignId: 1, userId: 1 }, { unique: true });

export type SnapshotSchema = InferSchemaType<typeof snapshotSchema>;
export const RankingSnapshotModel: Model<SnapshotSchema> =
  (models.RankingSnapshot as Model<SnapshotSchema> | undefined) ?? model<SnapshotSchema>("RankingSnapshot", snapshotSchema);

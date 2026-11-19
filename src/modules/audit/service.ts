import "server-only";
import { Schema, Types, model, models, type Model } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { redact } from "@/lib/logger";
import type { Pagination } from "@/lib/validation/common";

export const AUDIT_ACTIONS = [
  "USER_REGISTERED",
  "TEACHER_CREATED",
  "USER_STATUS_CHANGED",
  "USER_ROLE_CHANGED",
  "USER_PASSWORD_RESET_BY_ADMIN",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "EMAIL_VERIFIED",
  "ADMIN_BOOTSTRAPPED",
  "SUBJECT_CREATED",
  "SUBJECT_UPDATED",
  "TOPIC_CREATED",
  "TOPIC_UPDATED",
  "QUESTION_SUBMITTED",
  "QUESTION_APPROVED",
  "QUESTION_REJECTED",
  "QUESTION_ARCHIVED",
  "SCORING_RULE_CREATED",
  "SCORING_RULE_PUBLISHED",
  "EXAM_SUBMITTED",
  "EXAM_APPROVED",
  "EXAM_REJECTED",
  "EXAM_UNPUBLISHED",
  "EXAM_ARCHIVED",
  "CAMPAIGN_CREATED",
  "CAMPAIGN_ACTIVATED",
  "CAMPAIGN_FINALIZED",
  "ATTEMPTS_RECONCILED",
  "DEMO_SEEDED",
  "DEMO_REMOVED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

type AuditDoc = {
  actorId: Types.ObjectId | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

const auditSchema = new Schema<AuditDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    entityType: { type: String, required: true, maxlength: 40 },
    entityId: { type: String, default: null, maxlength: 64 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "audit_logs", timestamps: { createdAt: true, updatedAt: false }, minimize: false },
);
auditSchema.index({ actorId: 1, createdAt: -1 });
auditSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<AuditDoc> = (models.AuditLog as Model<AuditDoc> | undefined) ?? model<AuditDoc>("AuditLog", auditSchema);

export type AuditInput = {
  actorId: string | Types.ObjectId | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | Types.ObjectId | null;
  metadata?: Record<string, unknown>;
};

/** Metadata is redacted (no passwords/tokens/answers) and must not contain emails. */
export async function writeAudit(input: AuditInput): Promise<void> {
  await connectToDatabase();
  await AuditLogModel.create({
    actorId: input.actorId ? new Types.ObjectId(String(input.actorId)) : null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ? String(input.entityId) : null,
    metadata: (redact(input.metadata ?? {}) as Record<string, unknown>) ?? {},
  });
}

export type AuditLogDto = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function listAuditLogs(p: Pagination, filter: { action?: AuditAction } = {}) {
  await connectToDatabase();
  const query = filter.action ? { action: filter.action } : {};
  const [rows, total] = await Promise.all([
    AuditLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip((p.page - 1) * p.limit)
      .limit(p.limit)
      .populate<{ actorId: { _id: Types.ObjectId; displayName: string } | null }>("actorId", "displayName")
      .lean(),
    AuditLogModel.countDocuments(query),
  ]);
  const items: AuditLogDto[] = rows.map((r) => ({
    id: String(r._id),
    actorId: r.actorId ? String(r.actorId._id) : null,
    actorName: r.actorId?.displayName ?? null,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: r.metadata ?? {},
    createdAt: r.createdAt.toISOString(),
  }));
  return { items, total };
}

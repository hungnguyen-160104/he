import "server-only";
import { Schema, model, models, type Model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ROLES, USER_STATUSES } from "./roles";

export const LEADERBOARD_VISIBILITY = ["PUBLIC", "HIDDEN"] as const;
export type LeaderboardVisibility = (typeof LEADERBOARD_VISIBILITY)[number];

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 30 },
    usernameNormalized: { type: String, required: true },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    emailNormalized: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "STUDENT" },
    status: { type: String, enum: USER_STATUSES, required: true, default: "ACTIVE" },
    displayName: { type: String, required: true, trim: true, maxlength: 40 },
    grade: { type: Number, enum: [10, 11, 12], default: null },
    leaderboardVisibility: { type: String, enum: LEADERBOARD_VISIBILITY, default: "PUBLIC" },
    emailVerifiedAt: { type: Date, default: null },
    sessionVersion: { type: Number, required: true, default: 0 },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "users", strict: "throw" },
);

userSchema.index({ usernameNormalized: 1 }, { unique: true });
userSchema.index({ emailNormalized: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1, createdAt: -1 });

export type UserSchema = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserSchema>;

export const UserModel: Model<UserSchema> = (models.User as Model<UserSchema> | undefined) ?? model<UserSchema>("User", userSchema);

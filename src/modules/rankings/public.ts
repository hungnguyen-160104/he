import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import type { PeriodType } from "@/lib/utils/period";
import { RankingCampaignModel } from "./model";

/** Visible (ACTIVE/CLOSED) campaigns containing an exam — for the exam detail page. */
export async function listCampaignsForExam(examId: string): Promise<{ id: string; title: string; periodType: PeriodType; periodStartAt: string; periodEndAt: string; status: string }[]> {
  if (!/^[a-f0-9]{24}$/i.test(examId)) return [];
  await connectToDatabase();
  const rows = await RankingCampaignModel.find({ examIds: new Types.ObjectId(examId), status: { $in: ["ACTIVE", "CLOSED"] } }, { title: 1, periodType: 1, periodStartAt: 1, periodEndAt: 1, status: 1 })
    .sort({ periodStartAt: -1 })
    .limit(5)
    .lean();
  return rows.map((c) => ({ id: String(c._id), title: c.title, periodType: c.periodType, periodStartAt: c.periodStartAt.toISOString(), periodEndAt: c.periodEndAt.toISOString(), status: c.status }));
}

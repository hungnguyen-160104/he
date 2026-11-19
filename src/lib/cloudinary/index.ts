import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getEnv, isCloudinaryConfigured } from "@/lib/env";
import { errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { MAX_MEDIA_BYTES } from "@/modules/questions/types";
import type { MediaRef } from "@/modules/questions/validation";

/**
 * Signed client-direct uploads (spec §11). The server decides folder/format/timestamp; the API
 * secret never leaves the server. After upload the browser sends the public_id back and we
 * verify the asset through the Admin API (folder, format, size, resource type).
 */
const ALLOWED_FORMATS = "jpg,png,webp";

function configured() {
  if (!isCloudinaryConfigured()) {
    throw errors.configMissing("Chưa cấu hình Cloudinary. Bạn vẫn có thể tạo câu hỏi không có ảnh.");
  }
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return env;
}

export function questionMediaFolder(): string {
  return `${getEnv().CLOUDINARY_UPLOAD_FOLDER}/questions`;
}

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  maxBytes: number;
  uploadUrl: string;
};

export function createUploadSignature(): UploadSignature {
  const env = configured();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = questionMediaFolder();
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder, allowed_formats: ALLOWED_FORMATS }, env.CLOUDINARY_API_SECRET!);
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    maxBytes: MAX_MEDIA_BYTES,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
  type: string;
};

/** Verify an uploaded asset and return trusted metadata. Invalid assets are deleted. */
export async function verifyUploadedAsset(publicId: string): Promise<Omit<MediaRef, "alt">> {
  configured();
  const folder = questionMediaFolder();
  if (!publicId.startsWith(`${folder}/`) || !/^[A-Za-z0-9_\-/]+$/.test(publicId)) {
    throw errors.unprocessable("Ảnh không thuộc thư mục của hệ thống.");
  }
  let res: CloudinaryResource;
  try {
    res = (await cloudinary.api.resource(publicId, { resource_type: "image", type: "upload" })) as CloudinaryResource;
  } catch {
    throw errors.notFound("Không tìm thấy ảnh trên Cloudinary.");
  }
  const format = res.format?.toLowerCase();
  const invalid =
    res.resource_type !== "image" || !["jpg", "jpeg", "png", "webp"].includes(format) || res.bytes > MAX_MEDIA_BYTES || res.width > 10_000 || res.height > 10_000;
  if (invalid) {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true }).catch(() => undefined);
    throw errors.unprocessable("Ảnh không hợp lệ: chỉ chấp nhận JPG/PNG/WebP, tối đa 3 MB.");
  }
  return {
    publicId: res.public_id,
    secureUrl: res.secure_url,
    width: res.width,
    height: res.height,
    format: format as MediaRef["format"],
    bytes: res.bytes,
  };
}

/** Structural check for media refs inside question payloads (no arbitrary external URLs). */
export function assertMediaRefsAllowed(media: MediaRef[]): void {
  if (!media.length) return;
  if (!isCloudinaryConfigured()) throw errors.configMissing("Chưa cấu hình Cloudinary nên không thể đính kèm ảnh.");
  const cloud = getEnv().CLOUDINARY_CLOUD_NAME!;
  const folder = questionMediaFolder();
  for (const m of media) {
    const prefix = `https://res.cloudinary.com/${cloud}/image/upload/`;
    if (!m.secureUrl.startsWith(prefix) || !m.publicId.startsWith(`${folder}/`) || !m.secureUrl.includes(m.publicId)) {
      throw errors.unprocessable("Ảnh đính kèm không hợp lệ hoặc không thuộc hệ thống.");
    }
  }
}

/** Best-effort deletion of an unreferenced asset (never throws). */
export async function deleteAssetQuietly(publicId: string): Promise<void> {
  try {
    configured();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch {
    logger.warn("cloudinary.delete_failed", { publicId });
  }
}

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicDomain = process.env.R2_PUBLIC_DOMAIN;

const isR2Configured = !!(
  accountId &&
  accessKeyId &&
  secretAccessKey &&
  bucketName &&
  publicDomain
);

const s3 = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

/**
 * Uploads a logo file to Cloudflare R2 if credentials are set,
 * or falls back to public uploads locally.
 */
export async function uploadLogo(
  pharmacyId: string,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const extension = path.extname(fileName) || ".png";
  const key = `logos/${pharmacyId}-${Date.now()}${extension}`;

  if (s3 && isR2Configured) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName!,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );
    return `https://${publicDomain}/${key}`;
  } else {
    // Local fallback
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, `${pharmacyId}-${Date.now()}${extension}`);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/logos/${path.basename(filePath)}`;
  }
}

/**
 * Deletes an existing logo file from R2 or local disk.
 */
export async function deleteLogo(logoUrl: string): Promise<void> {
  if (!logoUrl) return;

  if (s3 && isR2Configured && logoUrl.includes(publicDomain!)) {
    const key = logoUrl.split(`${publicDomain!}/`)[1];
    if (!key) return;
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName!,
          Key: key,
        })
      );
    } catch (error) {
      console.error("❌ Failed to delete logo from Cloudflare R2:", error);
    }
  } else if (logoUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", logoUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("❌ Failed to delete local logo file:", error);
      }
    }
  }
}

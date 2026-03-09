
import { S3Client, GetObjectCommand  , PutObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.WASABI_REGION || "eu-west-1",
  endpoint: process.env.WASABI_ENDPOINT || "https://s3.eu-west-1.wasabisys.com",
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.WASABI_BUCKET_NAME;
const EXPIRES_IN = 60 * 60; // 1 hour

/**
 * Extracts the S3 object key from a full Wasabi URL.
 *
 * ⚠️ Also handles CORRUPTED stored URLs where multiple file URLs got
 * concatenated into one string during upload (a bug in the upload logic).
 * In that case we split on "https://" and take the LAST segment only.
 *
 * Corrupted example:
 *   "https://.../file1.pnghttps://.../file2.png" → uses "https://.../file2.png"
 */
const extractKey = (url) => {
  if (!url) return null;
  try {
    // Split on "https://" to detect concatenated URLs, take the last one
    const parts = url.split("https://").filter(Boolean);
    const lastUrl = "https://" + parts[parts.length - 1];

    const parsed = new URL(lastUrl);
    // pathname = "/nexcore/student-documents/abc.png"
    // strip "/<bucket>/" prefix
    const withoutBucket = parsed.pathname.replace(`/${BUCKET}/`, "");

    // decode %20 → spaces, etc.
    const key = decodeURIComponent(withoutBucket);
    return key;
  } catch (e) {
    console.error("❌ extractKey failed:", url, e.message);
    return null;
  }
};

/**
 * Generate a presigned URL for a single stored URL string.
 * Returns null if the input is empty/invalid.
 */
export const getPresignedUrl = async (storedUrl) => {
  const key = extractKey(storedUrl);
  if (!key) return null;

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn: EXPIRES_IN });
};

/**
 * Convert a documents object (raw S3 URLs) into presigned URLs.
 *
 * Input:  { aadhaarFront: "https://...", ... }
 * Output: { aadhaarFront: "https://...?X-Amz-Signature=...", ... }
 */
export const getPresignedDocuments = async (documents = {}) => {
  const entries = Object.entries(documents);
  const signed = await Promise.all(
    entries.map(async ([key, url]) => [key, await getPresignedUrl(url)])
  );
  return Object.fromEntries(signed);
};

export const uploadFile = async (buffer, key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return `https://s3.${process.env.WASABI_REGION || "eu-west-1"}.wasabisys.com/${BUCKET}/${key}`;
};
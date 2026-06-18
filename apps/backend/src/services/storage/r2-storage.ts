import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class R2StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY || '';
    this.bucket = process.env.R2_BUCKET_NAME || env.S3_BUCKET || 'vedaai-uploads';

    // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
    const endpoint = accountId 
      ? `https://${accountId}.r2.cloudflarestorage.com` 
      : process.env.R2_ENDPOINT_URL || undefined;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Save a buffer directly to R2
   */
  async save(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
    return this.getSignedDownloadUrl(key);
  }

  /**
   * Fetch object buffer from R2
   */
  async get(key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      if (!response.Body) return null;
      
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      logger.error(`[R2Storage] Get error for key=${key}: ${err}`);
      return null;
    }
  }

  /**
   * Delete object from R2
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (err) {
      logger.error(`[R2Storage] Delete error for key=${key}: ${err}`);
    }
  }

  /**
   * Check if object exists in R2
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate pre-signed URL for direct browser uploading (valid for 15 minutes)
   */
  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 }); // 15 mins
  }

  /**
   * Generate temporary pre-signed URL for downloading/viewing (valid for 15 minutes)
   */
  async getSignedDownloadUrl(key: string): Promise<string> {
    // If not configured (e.g. local dev), return public-url fallback
    const isMock = !process.env.R2_ACCOUNT_ID && !env.S3_ACCESS_KEY_ID;
    if (isMock) {
      return `/api/v1/papers/download/${key}`;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 }); // 15 mins
  }
}

let r2Instance: R2StorageAdapter | null = null;
export function getR2Storage(): R2StorageAdapter {
  if (!r2Instance) {
    r2Instance = new R2StorageAdapter();
  }
  return r2Instance;
}

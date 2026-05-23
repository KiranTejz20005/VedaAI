import { env } from '../../config/env';
import type { StorageAdapter } from './storage-adapter';

let S3Client: any;
let PutObjectCommand: any;
let GetObjectCommand: any;
let DeleteObjectCommand: any;
let HeadObjectCommand: any;

export class S3StorageAdapter implements StorageAdapter {
  private client: any;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET || 'vedaai-uploads';
    this.client = this.createClient();
  }

  private async createClient() {
    try {
      // @ts-expect-error - @aws-sdk/client-s3 is an optional peer dependency
      const mod = await import('@aws-sdk/client-s3');
      S3Client = mod.S3Client;
      PutObjectCommand = mod.PutObjectCommand;
      GetObjectCommand = mod.GetObjectCommand;
      DeleteObjectCommand = mod.DeleteObjectCommand;
      HeadObjectCommand = mod.HeadObjectCommand;

      return new S3Client({
        region: env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
        },
      });
    } catch {
      throw new Error('S3 storage requires @aws-sdk/client-s3 to be installed');
    }
  }

  async save(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
    const client = await this.client;
    await client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
    return this.getPublicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const client = await this.client;
      const response = await client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await this.client;
      await client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch {
      // noop
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.client;
      await client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
}

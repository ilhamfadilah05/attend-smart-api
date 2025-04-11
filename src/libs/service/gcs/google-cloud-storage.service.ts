import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GoogleCloudStorage {
  private readonly storage: Storage;
  public name = 'gcs';
  constructor() {
    const gcsConfig =
      'src/libs/secret/gcp/' + process.env.GSC_CREDENTIAL_FILE_NAME;
    this.storage = new Storage({
      keyFilename: gcsConfig,
    });
  }

  extractFileName(url: string): string | null {
    const filename = new URL(url).pathname.split('/').pop();
    return filename;
  }

  async uploadFile({
    bucketName,
    destination,
    fileName,
    multerFile,
  }: {
    bucketName: string;
    destination: string;
    fileName: string;
    multerFile: Express.Multer.File;
  }): Promise<string> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(`${destination}/${fileName}`);

      await file.save(multerFile.buffer, {
        metadata: {
          contentType: multerFile.mimetype,
          contentLength: multerFile.size,
        },
      });
      await file.makePublic();
      return `https://storage.googleapis.com/${bucketName}/${destination}/${fileName}`;
    } catch (error) {
      console.log('GCS : Failed to upload file\n', error);
      throw new ServiceUnavailableException('Cannot upload file');
    }
  }

  async listFiles(prefix?: string) {
    try {
      const [files] = await this.storage
        .bucket(process.env.STORAGE_BUCKET_NAME)
        .getFiles({ prefix: prefix ? prefix : '' });

      const result = files.map((file) => {
        return file.name;
      });
      return result;
    } catch (error) {
      console.log('GCS : Failed to get file\n', error);
      throw new ServiceUnavailableException('Cannot get file');
    }
  }

  async removeFile({
    bucketName,
    destination,
    fileName,
  }: {
    bucketName: string;
    destination: string;
    fileName: string;
  }): Promise<void> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(`${destination}/${fileName}`);
      await file.delete();
    } catch (error) {
      console.log('GCS : ' + `${bucketName}/${destination}/${fileName}`);
      console.log('GCS : Failed to remove file\n', error);
      throw new ServiceUnavailableException('Cannot remove file');
    }
  }

  async generateSignedUrl({
    bucketName,
    destination,
    fileName,
  }: {
    bucketName: string;
    destination: string;
    fileName: string;
  }) {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(`${destination}/${fileName}`);
      const signedUrl = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60,
      });
      console.log(signedUrl, '---- signedUrl');
      return signedUrl[0];
    } catch (error) {
      console.log('GCS : Failed to generate signed url \n', error);
      throw error;
    }
  }

  async download(bucketName: string, path: string) {
    try {
      const [buffer] = await this.storage
        .bucket(bucketName)
        .file(path)
        .download();
      return buffer;
    } catch (error) {
      throw error;
    }
  }

  async checkFileExists({
    bucketName,
    destination,
    fileName,
  }: {
    bucketName: string;
    destination: string;
    fileName: string;
  }) {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(`${destination}/${fileName}`);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      throw error;
    }
  }

  async getMetaData(bucketName: string, path: string) {
    try {
      const [metadata] = await this.storage
        .bucket(bucketName)
        .file(path)
        .getMetadata();
      return metadata;
    } catch (error) {
      throw error;
    }
  }
}

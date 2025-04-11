import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);

  constructor() {
    if (!admin.apps.length) {
      const serviceAccountPath = path.resolve(
        __dirname,
        '../../config/attend-smart-01-firebase-adminsdk-kxdvf-d94d11dae3.json',
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: 'attend-smart-01.appspot.com',
      });

      console.log('Firebase initialized successfully!aa');
    }
  }
  async uploadFile({
    file,
    fileName,
  }: {
    file: Express.Multer.File;
    destination?: string;
    fileName?: string;
  }): Promise<string> {
    const bucket = admin.storage().bucket();
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        try {
          // 🔹 Buat file menjadi public
          await fileUpload.makePublic();

          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
          this.logger.log('File uploaded successfully:', publicUrl);
          resolve(publicUrl);
        } catch (error) {
          this.logger.error('Error setting file public:', error);
          reject(error);
        }
      });

      stream.on('error', (err) => {
        this.logger.error('Error uploading file:', err);
        reject(err);
      });

      stream.end(file.buffer);
    });
  }

  async removeFile(fileName: string) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);
    await file.delete();
  }
}

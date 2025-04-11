import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);

  constructor() {
    if (!admin.apps.length) {
      const serviceAccountPath = path.resolve(
        __dirname,
        '../../config/notif-firebase-key.json',
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: 'attend-smart-01.appspot.com',
      });

      this.logger.log('Firebase initialized successfully!z');
    }
  }

  async sendNotification(token: string, payload: any) {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          image: payload.image,
        },
        data: payload.data,
        token: token,
      };

      return admin.messaging().send(message);
    } catch (error) {
      this.logger.error(error);
    }
  }
}

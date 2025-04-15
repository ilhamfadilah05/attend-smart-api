import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
// import path from 'path';

export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);

  constructor() {
    if (!admin.apps.length) {
      // const serviceAccountPath = path.resolve(
      //   __dirname,
      //   '../../config/notif-firebase-key.json',
      // );

      admin.initializeApp({
        credential: admin.credential.cert(
          // serviceAccountPath,
          {
            projectId: 'attend-smart-01',
            clientEmail:
              'firebase-adminsdk-kxdvf@attend-smart-01.iam.gserviceaccount.com',
            privateKey:
              '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCv2oc9lNXFuRxd\nI4a6yhHbcn3iS28xdxHSCEECuS/yT3UjqagpLk3cFf/hLsx7IDUWFZ2bgRrmF4Hb\nxgM2C8c0u2r1OrjKN3/LC2u9V6zpth8Oh9dbSQ2sJpI0tqxjgjGLX/neJ75KVEfb\n/OlB4PyieyW9gG5hxzvMUA6b6ga0clXYJx3abj7p0dvAZo2Da8m1SO/8ymIyoNQI\nl4so5xaBSVQ26PEEEc4ik7C5Fn8OfwZ4cQeVITH6QpaQrwOOo+8cx1iTSSWrpVdC\nd2EztetodGhIso4MM+LCHPIBWkx3Qzz9SsFCrKBq+389bNaxQ8PYXyBQQpIF8UJN\nrQ45PdS5AgMBAAECggEAAtJBfzRuM8xxRGMM+KUZhOkEjZGpz5XodSxMgWE8VVtw\nxOWYB6H/U1gOkXLb/FG3oTUvy1yPdHlbaI3NR5vrp7QmD0K0CH0t5upgjD4e27wn\nRkq9MP8uRU7mAAssAt0ipT4hD8u1cC+f+NlzzCOO7Z6jD5eYO/0jhswu5u4i0Z/X\nYVob0BQKW8oYHJsoUC+bAAkLaxVO42nmFPAhrngoWwf/XALUgm6JdXGgj/VADcMO\nWBz01z+vxXUdQT9qpUO8zi7fnUjRO3k9kAJJLlBr7Tza3sZsqvrghuxPJwweAVQc\nQzVmUTIve+B2hJj+hNluPDm2OyIy43iWXCXegGXrHQKBgQDetFUBYe1RNqMHSoEE\nDmEyQum/w2kpCEEF5xW9pz7AARp9BoP+WDeHb+jFXlHN9SyRZkCa2WNvtlmU7jHm\nqwuFYv/qos0U878ZMhxKv55yCjjxHHeUF5gEpOxcAMCT4QCOK0jYfyKAZ1NIlmH3\nNuVkFzzZzBgdU0oir/9UPPbOewKBgQDKJQ3pZ1xh0xpm8WGDH9hWHuc7/O3udaH2\nuQEmxPoUa0Qywq0pArUozy/2kwCjRaKB7xwXoS6sDAUhTnY2nNchmGuGyhmTZLSQ\nmFwYtxAVi5lJAK9UnnLQOwPEqaQ0aDBHRBcEgplMZITQRS0e0cnOkKQnF3HJ2+15\nhcMoDVOdWwKBgHIBJKbhh4gUjR51YFhAODdvk5NsKFAt/oNUCYgdrnzB09p+1GEG\nrd5yRlmK8Bubz6XbD2V1tXaBhZg822S22N3+kP1/O7bnFEOEqIEHWMgOPZoINZqk\n/VgbSTfL1smc3BjrRY42fuX2fubgvOO9wW4cizT/SrTwZzocmHt5/eozAoGAc8fP\ndQ1Ho5xHNgkxYeo+fe1LYleXbAqiTu9eEnemCUX7FNveVGwBmTM6dI90QRAkaSms\nPHiMg+yKj64iFVu1+L8Vb2mYRozawysRLPLFWqHPlTm4Ms5iUpRKrzy/GWlHpboB\nOQsYhOHaFHRayJk+bnr4Go/aE9VM6lrMEce4SZsCgYBS/lBLEnZEzWDf1WG7r81V\nP0jsjwgXLU60G0XPht1jajBpzA0RzrW54VBcSIz/AOpNqs1uj2kddnV9GapEe8sL\nfhZ2XLXTjJ1T5gT6cqtcP++dOaDVtZdWUnv3CrZ3LC2KFbNRNRbaAoHgQ5In8eId\nyTj/FEuSw36dfewK+P8MGA==\n-----END PRIVATE KEY-----\n',
          },
        ),
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

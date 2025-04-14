import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'attend-smart-01',
          clientEmail:
            'firebase-adminsdk-kxdvf@attend-smart-01.iam.gserviceaccount.com',
          privateKey:
            '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCE/PJW79rcJpK\nlqiDN2wBFg1CpO2tP8aT0/EZigu+muO13d91cYtTdzQAjbes3k8hG4ruVEIvTp23\n6rVEVjisOXhYP4SUaItL3vTYybbkerLV65v7BUOQlGGdPPiwTbirhL2AjPPl3n4e\nqt7xMOtv+o+zY3WC8KCup6szVz8rwhaunyE1gVGeRNl406MxiKfL6y4rCbiptesw\nfB5nF4tZNmW5DER11Tm/b1VQSSKWZ5bYCBLujkinzv99MJYvByci/TGSoAK6+i2f\nunSTpEMz1Yh2FEQUPddIMpHYKfLY8YoLeJkQTF5TyOwgpX6e/Yq9JfSiQoTUbOnQ\nvTkWepRBAgMBAAECggEAD7GUV5aDMplu6JQpOT8cjTPuy5JRo95R3PdY+jM3Auk8\ne6Le5HzTguLTQi4ziZeKd4dmIyKOHYwyZcJleQqt14NoL16nhmazyOVVEEizcONZ\nHcJJITHKRmExSYk6JOuMANahikkbmd11fl5b284UY8AzqZJj2LxDigwF5IdsFMof\nZRO0u2irG74yVAuAfm77REBEa4BwxFpF10WSbYGBlA5S1xr7Dn0gBHzaCii0aiCV\nB8JFZ1uIWPfH4tNtfGNz8eqcPGT0kZZOC6E7eJUdO8nL99JusGnOiagXXKxxUcdO\nqXG4Diw8IEBYmSKeE4UkeogrpSVI5l67i7HSBj+mIQKBgQDygL6gwu6JFb+9vg9e\n4TmwQxfvpH98/GKVhfADs4YMWklu35x0vDV47RIEjLYInrSDLTJhZNCgpVcejnc6\nqCI4exJL8vsfudFfhLolVDupvI4nuSI1Ku7leHL/5wM7zTvn+kG+oHfaFQU1ZdII\nmnc0nuh0pM+5UzC9UQ8DC4aPaQKBgQDM4Tvh8tTwLEnI2SKuD0PYxrQ/VXF2jGcb\nVYIMAzRnzkL6mLb7r3iNXrN3/P/JkdJGcfB4uTR68JCFoNCT7v9jWLE8Ybrqj/vG\n72Qnc76YBX3UvYGA8jia7yQq199LVfl7e36EEfTqcCjBBRxkvdFVDAWBFfeiraur\nToLSQzKbGQKBgQC3l2C6tNmCT0TqkYlxe3IBT8o/U3pxVWINcWlUZAWINJKDrib0\n+chB1LlfWGg3/m8LIJyTv49zD7n1GEaL0d6WhBZGCZ61Vih8+C81M6A30NiOmkqb\nlfVnJNlrg6mfDLHd3kkH2NTj9iYLVxq8CLVW0TeLl3rsA19S9Js44vDsgQKBgQCI\nLqaJN8oGosmgsYP1wrvMWbfx6S90JztZ1eqNZYvt/BJVVDE89pPhFDOi7A5xw3XL\n0WyQMjsKBOFrkUtTKaekN44HnsaJp48p2nHuL2de0TeksxpjxZ2Ojqqxt6/6+XjN\ndXbQ/saXFlpggq8u32VHbKgz95AVF+9l/NfEP1ph8QKBgHLQXZwbo41V20xDUMaH\nNW29XJIXhsy340VxoRiM0YVkdaiZIMUsCIxGjWDqM7iaSGe5uxjRTe9lo3kALLky\nq7FUwBJs5FQzjSrShXYKrWtFLvTmuQpZ8bLfnrw7U1h/2mnNKXP8fyF0ksEod0WD\nrLBE5kcRluoc0TXGARInz3Sl\n-----END PRIVATE KEY-----\n',
        }),
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

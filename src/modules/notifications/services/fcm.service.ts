import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FCMService implements OnModuleInit {
  private readonly logger = new Logger(FCMService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase configuration missing. FCM notifications will be disabled.');
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error.message);
    }
  }

  async sendMessage(message: admin.messaging.Message): Promise<string | null> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized. Cannot send FCM message.');
      return null;
    }

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`FCM message sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to send FCM message:', error.message);
      
      // Handle specific FCM errors
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn('FCM token is invalid or expired');
        throw new Error('INVALID_TOKEN');
      }
      
      if (error.code === 'messaging/quota-exceeded') {
        this.logger.error('FCM quota exceeded');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      throw error;
    }
  }

  async sendToToken(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<string | null> {
    const message: admin.messaging.Message = {
      token,
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          color: '#4A90E2',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/assets/icons/notification-icon.png',
          badge: '/assets/icons/badge-icon.png',
          actions: [
            {
              action: 'open_chat',
              title: 'Open Chat',
            },
          ],
        },
      },
    };

    return this.sendMessage(message);
  }

  async sendToTopic(
    topic: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<string | null> {
    const message: admin.messaging.Message = {
      topic,
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          color: '#4A90E2',
        },
      },
    };

    return this.sendMessage(message);
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized. Cannot subscribe to topic.');
      return;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(`Successfully subscribed ${response.successCount} tokens to topic: ${topic}`);
      
      if (response.failureCount > 0) {
        this.logger.warn(`Failed to subscribe ${response.failureCount} tokens to topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error.message);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized. Cannot unsubscribe from topic.');
      return;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Successfully unsubscribed ${response.successCount} tokens from topic: ${topic}`);
      
      if (response.failureCount > 0) {
        this.logger.warn(`Failed to unsubscribe ${response.failureCount} tokens from topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error.message);
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      // Try to send a dry-run message to validate the token
      await admin.messaging().send({
        token,
        notification: { title: 'Test', body: 'Test' },
      }, true); // dry-run = true
      
      return true;
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      return false;
    }
  }

  async sendBatchMessages(messages: admin.messaging.Message[]): Promise<admin.messaging.BatchResponse | null> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized. Cannot send batch messages.');
      return null;
    }

    try {
      const response = await admin.messaging().sendEach(messages);
      this.logger.log(`Batch messages sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to send batch messages:', error.message);
      throw error;
    }
  }
}

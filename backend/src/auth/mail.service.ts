import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import {
  EmailNotification,
  EmailNotificationDocument,
} from '../email-notifications/entities/email-notification.entity';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  constructor(
    @InjectModel(EmailNotification.name)
    private emailNotificationModel: Model<EmailNotificationDocument>,
  ) {
    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ Mail transporter error:', error);
      } else {
        console.log('✅ Mail server is ready');
      }
    });
  }

  async sendOtp(recipientId: Types.ObjectId, email: string, otp: string) {
    const subject = 'Your verification code';
    const body = `Your verification code is: ${otp}. It expires in 10 minutes.`;

    const record = await this.emailNotificationModel.create({
      recipientId,
      type: 'otp_verification',
      subject,
      body,
      status: 'pending',
      metadata: { email },
    });

    try {
      await this.transporter.sendMail({
        from: `"Oralis AI" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Verify your email</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ef4444; padding: 20px 0;">
              ${otp}
            </div>
            <p style="color: #888;">This code expires in 10 minutes.</p>
          </div>
        `,
      });

      await this.emailNotificationModel.updateOne(
        { _id: record._id },
        { status: 'sent', sentAt: new Date() },
      );
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.emailNotificationModel.updateOne(
        { _id: record._id },
        { status: 'failed', metadata: { email, error: errMessage } },
      );

      throw error;
    }
  }

  async sendPasswordResetOtp(
    recipientId: Types.ObjectId,
    email: string,
    otp: string,
  ) {
    const subject = 'Your password reset code';
    const body = `Your password reset code is: ${otp}. It expires in 10 minutes.`;

    const record = await this.emailNotificationModel.create({
      recipientId,
      type: 'password_reset',
      subject,
      body,
      status: 'pending',
      metadata: { email },
    });

    try {
      await this.transporter.sendMail({
        from: `"Oralis AI" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Reset your password</h2>
            <p>Your password reset code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ef4444; padding: 20px 0;">
              ${otp}
            </div>
            <p style="color: #888;">This code expires in 10 minutes.</p>
            <p style="color: #888;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });

      await this.emailNotificationModel.updateOne(
        { _id: record._id },
        { status: 'sent', sentAt: new Date() },
      );
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.emailNotificationModel.updateOne(
        { _id: record._id },
        { status: 'failed', metadata: { email, error: errMessage } },
      );

      throw error;
    }
  }
  async sendPasswordChangedConfirmation(
    recipientId: Types.ObjectId,
    email: string,
    firstName: string,
  ) {
    const subject = 'Your password was changed';
    const body = `Hi ${firstName}, your Oralis AI account password was just changed.`;
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const record = await this.emailNotificationModel.create({
      recipientId,
      type: 'password_changed',
      subject,
      body,
      status: 'pending',
      metadata: { email },
    });

    try {
      await this.transporter.sendMail({
        from: `"Oralis AI" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px 40px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
              🔐 Password Changed
            </h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px 40px;">
            <p style="margin: 0 0 12px; font-size: 16px;">
              Hi <strong>${firstName}</strong>,
            </p>
            <p style="margin: 0 0 24px; color: #d1d5db; font-size: 15px; line-height: 1.6;">
              Your <strong style="color: #f1f1f1;">Oralis AI</strong> account password was successfully changed on
              <strong style="color: #f1f1f1;">${timestamp}</strong>.
            </p>

            <!-- Alert box -->
            <div style="background: #1f1f1f; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #f87171; font-weight: 600;">
                ⚠️ Didn't make this change?
              </p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                If you did not change your password, your account may be compromised.
                Please reset your password immediately or contact support.
              </p>
            </div>

            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              This is an automated security notification. Please do not reply to this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #1f1f1f; padding: 20px 40px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #4b5563;">
              © ${new Date().getFullYear()} Oralis AI · All rights reserved
            </p>
          </div>

        </div>
      `,
      });

      await this.emailNotificationModel.updateOne(
        { _id: record._id },
        { status: 'sent', sentAt: new Date() },
      );
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.emailNotificationModel.updateOne(
        { _id: record._id },
        { status: 'failed', metadata: { email, error: errMessage } },
      );

      throw error;
    }
  }
}

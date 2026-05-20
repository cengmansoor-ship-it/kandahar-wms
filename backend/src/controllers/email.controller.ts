import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const sendEmail = async (req: Request, res: Response) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, body' });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    return res.status(503).json({
      success: false,
      message: 'SMTP_NOT_CONFIGURED',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"کندهار پوهنتون WMS" <${smtpUser}>`,
      to,
      subject,
      text: body,
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 2; color: #1f2937; padding: 24px;">
        ${body.replace(/\n/g, '<br>')}
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 11px; color: #9ca3af; margin-top: 12px;">
          کندهار پوهنتون — د ګدام او تدارکاتو مدیریت سیستم
        </p>
      </div>`,
    });

    return res.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Email send error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
    });
  }
};

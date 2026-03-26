import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.MAIL_USER,
      pass: env.MAIL_PASS,
    },
  });

  return transporter;
};

export const canSendCredentialEmail = () => Boolean(env.MAIL_USER && env.MAIL_PASS);

export const sendCredentialEmail = async ({ toEmail, userName, userId, password, role = 'student' }) => {
  if (!canSendCredentialEmail()) {
    throw new Error('MAIL_USER and MAIL_PASS are not configured');
  }

  const mailer = getTransporter();
  const roleLabel = role ? `${String(role).charAt(0).toUpperCase()}${String(role).slice(1)}` : 'User';
  const subject = `Your FaceAttend ${roleLabel} Login Credentials`;
  const text = [
    `Hello ${userName || roleLabel},`,
    '',
    'Your FaceAttend account has been created by the admin.',
    '',
    `Username/Email: ${toEmail}`,
    `${roleLabel} ID: ${userId}`,
    `Password: ${password}`,
    '',
    'Please log in and change your password after first login.',
    '',
    'Regards,',
    'FaceAttend Team',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">FaceAttend ${roleLabel} Credentials</h2>
      <p>Hello ${userName || roleLabel},</p>
      <p>Your FaceAttend account has been created by the admin.</p>
      <table style="border-collapse: collapse; margin: 12px 0;">
        <tr><td style="padding: 6px 12px; font-weight: 600;">Username/Email</td><td style="padding: 6px 12px;">${toEmail}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: 600;">${roleLabel} ID</td><td style="padding: 6px 12px;">${userId}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: 600;">Password</td><td style="padding: 6px 12px;">${password}</td></tr>
      </table>
      <p>Please log in and change your password after first login.</p>
      <p style="margin-top: 18px;">Regards,<br/>FaceAttend Team</p>
    </div>
  `;

  const info = await mailer.sendMail({
    from: env.MAIL_FROM || env.MAIL_USER,
    to: toEmail,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
  };
};

export const sendStudentCredentialEmail = async ({ toEmail, studentName, studentId, password }) =>
  sendCredentialEmail({
    toEmail,
    userName: studentName,
    userId: studentId,
    password,
    role: 'student',
  });

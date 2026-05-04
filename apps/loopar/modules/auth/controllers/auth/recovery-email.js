import { loopar } from 'loopar';

const APP_URL = process.env.DOMAIN || 'localhost:3000';

export async function sendPasswordResetEmail(user, rawToken) {

  const resetUrl = `https://${APP_URL}/auth/recoveryPassword?token=${rawToken}`;

  await loopar.mail.send({
    to: user.email,
    subject: 'Reset your password — Loopar',
    template: 'password-reset',
    data: {
      userName: user.full_name || user.name,
      resetUrl,
      expiresIn: '30 minutes',
    },
    html: `
      <p>Hi ${user.full_name || user.name},</p>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${resetUrl}" style="background:#1D9E75;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Reset password
        </a>
      </p>
      <p>This link expires in <strong>30 minutes</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <small>Or copy this link: ${resetUrl}</small>
    `,
  });
}

export async function sendUsernameReminderEmail(user) {
  await loopar.mail.send({
    to: user.email,
    subject: 'Your username — Loopar',
    html: `
      <p>Hi,</p>
      <p>Your Loopar username is:</p>
      <p style="font-size:1.4rem;font-weight:bold;letter-spacing:0.05em">${user.name}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
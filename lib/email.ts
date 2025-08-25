import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendConfirmationEmail(email: string, token: string) {
  const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/confirm?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Confirm your email address',
    html: `<p>Please click this link to confirm your email address:</p><p><a href="${confirmationUrl}">${confirmationUrl}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
}

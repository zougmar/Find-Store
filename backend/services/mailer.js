const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendAdminEmail({ subject, html }) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'o.zouglah03@gmail.com';
  const transport = createTransport();
  if (!transport) {
    console.warn('Email skipped: set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({ from, to, subject, html });
  return { sent: true };
}

module.exports = { sendAdminEmail };

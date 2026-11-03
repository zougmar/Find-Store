require('dotenv').config();
const { verifySmtp } = require('../services/mailer');

verifySmtp()
  .then((result) => {
    if (!result.ok) {
      console.error('SMTP not ready:', result.reason);
      process.exit(1);
    }
    console.log('SMTP connection verified');
  })
  .catch((error) => {
    console.error('SMTP verification failed:', error.code || error.responseCode || 'error');
    process.exit(1);
  });

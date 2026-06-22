const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to resolve IPv4 addresses first to bypass IPv6 DNS resolution issues on Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('Failed to set DNS result order:', e.message);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to bypass Render's lack of IPv6 support
  auth: {
    user: 'nallamilliramacharanreddy@gmail.com',
    pass: 'lmvy oszf cixi rvpj'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async ({ to, subject, html }) => {
  // 1. Try Google Apps Script Web App HTTPS API (if configured)
  if (process.env.EMAIL_API_URL) {
    console.log(`[EMAIL] Attempting to send email via Google Apps Script HTTPS API to ${to}...`);
    try {
      const response = await fetch(process.env.EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to, subject, html })
      });
      const data = await response.json();
      if (data && data.success) {
        console.log(`[EMAIL] Email sent successfully via Google Apps Script HTTPS API to ${to}`);
        return { success: true, method: 'google_apps_script' };
      }
      throw new Error(data?.message || data?.error || 'Unsuccessful response from Google Apps Script Web App');
    } catch (err) {
      console.error('[EMAIL] Google Apps Script HTTPS API sending failed:', err.message);
    }
  }

  // 2. Try Brevo HTTPS API (if configured)
  if (process.env.BREVO_API_KEY) {
    console.log(`[EMAIL] Attempting to send email via Brevo HTTPS API to ${to}...`);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'Green Skill Rural Security',
            email: process.env.BREVO_SENDER || 'nallamilliramacharanreddy@gmail.com'
          },
          to: [{ email: to }],
          subject,
          htmlContent: html
        })
      });
      if (response.status === 201 || response.status === 200) {
        console.log(`[EMAIL] Email sent successfully via Brevo HTTPS API to ${to}`);
        return { success: true, method: 'brevo' };
      }
      const errText = await response.text();
      throw new Error(`Brevo returned status code ${response.status}: ${errText}`);
    } catch (err) {
      console.error('[EMAIL] Brevo HTTPS API sending failed:', err.message);
    }
  }

  // 3. Fallback to standard SMTP
  console.log(`[EMAIL] Attempting standard SMTP send to ${to}...`);
  const mailOptions = {
    from: '"Green Skill Rural Security" <nallamilliramacharanreddy@gmail.com>',
    to,
    subject,
    html
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[EMAIL] SMTP sending failed:', error);
        reject(error);
      } else {
        console.log(`[EMAIL] SMTP email sent successfully to ${to}: ${info.messageId}`);
        resolve({ success: true, method: 'smtp' });
      }
    });
  });
};

module.exports = {
  sendEmail,
  transporter
};

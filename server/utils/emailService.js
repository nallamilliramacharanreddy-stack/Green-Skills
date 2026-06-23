const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to resolve IPv4 addresses first to bypass IPv6 DNS resolution issues on Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('Failed to set DNS result order:', e.message);
}

const https = require('https');
const url = require('url');

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

// Helper for sending POST request via native https module
const sendViaHttps = (targetUrl, data) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = url.parse(targetUrl);
      const postData = JSON.stringify(data);

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse JSON response', body });
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const sendEmail = async ({ to, subject, html }) => {
  // 1. Try Google Apps Script Web App HTTPS API (if configured or use fallback URL)
  const emailApiUrl = process.env.EMAIL_API_URL || 'https://script.google.com/macros/s/AKfycbwuGzz7bBX8URr4jpSkeZJM080TE5Ue3rc-UVDJykaEBGdRkHg9kzTxkFHpA5O9QKll/exec';
  if (emailApiUrl) {
    console.log(`[EMAIL] Attempting to send email via Google Apps Script HTTPS API to ${to}...`);
    try {
      let data;
      if (typeof fetch === 'function') {
        const response = await fetch(emailApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ to, subject, html })
        });
        data = await response.json();
      } else {
        console.log('[EMAIL] global.fetch is not defined. Falling back to native https module.');
        data = await sendViaHttps(emailApiUrl, { to, subject, html });
      }

      if (data && data.success) {
        console.log(`[EMAIL] Email sent successfully via Google Apps Script HTTPS API to ${to}`);
        return { success: true, method: 'google_apps_script' };
      }
      throw new Error(data?.message || data?.error || 'Unsuccessful response from Google Apps Script Web App');
    } catch (err) {
      console.warn('[EMAIL] Google Apps Script HTTPS API sending failed, trying HTTPS fallback:', err.message);
      try {
        const data = await sendViaHttps(emailApiUrl, { to, subject, html });
        if (data && data.success) {
          console.log(`[EMAIL] Email sent successfully via Google Apps Script HTTPS fallback to ${to}`);
          return { success: true, method: 'google_apps_script_fallback' };
        }
        throw new Error(data?.message || data?.error || 'Unsuccessful response from Google Apps Script Web App (fallback)');
      } catch (fallbackErr) {
        console.error('[EMAIL] Google Apps Script HTTPS fallback sending failed:', fallbackErr.message);
      }
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

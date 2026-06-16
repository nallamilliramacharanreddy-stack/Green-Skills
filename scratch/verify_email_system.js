const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
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
    console.log(`[TEST-EMAIL] Attempting to send email via Google Apps Script HTTPS API to ${to}...`);
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
        console.log(`[TEST-EMAIL] Email sent successfully via Google Apps Script HTTPS API to ${to}`);
        return { success: true, method: 'google_apps_script' };
      }
      throw new Error(data?.message || data?.error || 'Unsuccessful response from Google Apps Script Web App');
    } catch (err) {
      console.error('[TEST-EMAIL] Google Apps Script HTTPS API sending failed:', err.message);
    }
  }

  // 2. Try Brevo HTTPS API (if configured)
  if (process.env.BREVO_API_KEY) {
    console.log(`[TEST-EMAIL] Attempting to send email via Brevo HTTPS API to ${to}...`);
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
        console.log(`[TEST-EMAIL] Email sent successfully via Brevo HTTPS API to ${to}`);
        return { success: true, method: 'brevo' };
      }
      const errText = await response.text();
      throw new Error(`Brevo returned status code ${response.status}: ${errText}`);
    } catch (err) {
      console.error('[TEST-EMAIL] Brevo HTTPS API sending failed:', err.message);
    }
  }

  // 3. Fallback to standard SMTP
  console.log(`[TEST-EMAIL] Attempting standard SMTP send to ${to}...`);
  const mailOptions = {
    from: '"Green Skill Rural Security" <nallamilliramacharanreddy@gmail.com>',
    to,
    subject,
    html
  };
  
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[TEST-EMAIL] SMTP sending failed:', error);
        reject(error);
      } else {
        console.log(`[TEST-EMAIL] SMTP email sent successfully to ${to}: ${info.messageId}`);
        resolve({ success: true, method: 'smtp' });
      }
    });
  });
};

async function runTests() {
  console.log("--- Starting Email Logic Verification ---");
  
  // Test case 1: Standard SMTP Fallback (no env variables)
  console.log("\n[TEST CASE 1] Testing standard SMTP fallback...");
  try {
    const result = await sendEmail({
      to: 'nallamilliramacharanreddy@gmail.com',
      subject: 'Test Case 1 - SMTP Fallback',
      html: '<p>This is a test of standard SMTP fallback.</p>'
    });
    console.log("Result 1:", result);
  } catch (err) {
    console.error("Test Case 1 FAILED:", err);
  }

  // Test case 2: Mock Google Apps Script Failure
  console.log("\n[TEST CASE 2] Testing Google Apps Script error handling & SMTP fallback...");
  process.env.EMAIL_API_URL = 'https://script.google.com/macros/s/invalid-url/exec';
  try {
    const result = await sendEmail({
      to: 'nallamilliramacharanreddy@gmail.com',
      subject: 'Test Case 2 - Proxy Fallback to SMTP',
      html: '<p>This should fall back to SMTP due to invalid proxy URL.</p>'
    });
    console.log("Result 2:", result);
  } catch (err) {
    console.error("Test Case 2 FAILED:", err);
  }
  
  console.log("\n--- Verification Completed ---");
}

runTests();

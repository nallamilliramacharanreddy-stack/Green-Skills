const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: 'nallamilliramacharanreddy@gmail.com',
    pass: 'iqkg pkjv kmfw kogg'
  }
});

async function run() {
  console.log("Sending test email...");
  try {
    const info = await transporter.sendMail({
      from: '"Test Security" <nallamilliramacharanreddy@gmail.com>',
      to: 'nallamilliramacharanreddy@gmail.com',
      subject: 'Test Email',
      text: 'If you see this, email sending works!'
    });
    console.log("Email sent successfully:", info.messageId);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

run();

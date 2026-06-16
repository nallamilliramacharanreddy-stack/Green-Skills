const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4
  auth: {
    user: 'nallamilliramacharanreddy@gmail.com',
    pass: 'lmvy oszf cixi rvpj'
  }
});

const mailOptions = {
  from: '"Green Skill Rural Security" <nallamilliramacharanreddy@gmail.com>',
  to: 'nallamilliramacharanreddy@gmail.com',
  subject: 'Test SMTP Mail Sending',
  text: 'If you receive this, SMTP is working perfectly!'
};

console.log('Sending test email...');
transporter.sendMail(mailOptions)
  .then(info => {
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('SMTP Send Failed:', err);
    process.exit(1);
  });

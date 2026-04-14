require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Generic send email function
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"backend-bank2" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Registration Email
async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to backend-bank2';

  const text = `Hello ${name},

Thank you for registering at backend-bank2. We are excited to have you!

Best regards`;

  const html = `
    <p>Hello ${name},</p>
    <p>Thanks for registering!</p>
    <p>Best regards,<br>Backend-bank2</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

// Transaction Success Email
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful';

  const text = `Hello ${name},

Your transaction of ₹${amount} to account ${toAccount} was successful.`;

  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <b>₹${amount}</b> to account <b>${toAccount}</b> was successful.</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

// Transaction Failure Email
async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed';

  const text = `Hello ${name},

We regret to inform you that your transaction of ₹${amount} to account ${toAccount} has failed.`;

  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <b>₹${amount}</b> to account <b>${toAccount}</b> has failed.</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};
const nodemailer = require('nodemailer');

// Configure transporter
// For production, use actual SMTP details from your provider (e.g., Namecheap, Google, SendGrid)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // e.g., noreply@ahlafot.com
    pass: process.env.EMAIL_PASS, // App password or SMTP password
  },
});

/**
 * Send a generic email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"AHLAFOT" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Could not send email');
  }
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user) => {
    return sendEmail({
        to: user.email,
        subject: 'Welcome to AHLAFOT!',
        text: `Hi ${user.full_name}, welcome to AHLAFOT! We are excited to have you in our community.`,
        html: `<h1>Welcome to AHLAFOT!</h1><p>Hi ${user.full_name},</p><p>We are excited to have you in our community. Start trading items and connecting with professionals today!</p>`,
    });
};

/**
 * Send trade offer notification
 */
const sendTradeOfferEmail = async (receiver, initiatorName) => {
    return sendEmail({
        to: receiver.email,
        subject: 'New Trade Offer Received!',
        text: `Hi ${receiver.full_name}, you have received a new trade offer from ${initiatorName}. Check it out on AHLAFOT!`,
        html: `<h2>New Trade Offer!</h2><p>Hi ${receiver.full_name},</p><p>You have received a new trade offer from <strong>${initiatorName}</strong>.</p><p><a href="${process.env.FRONTEND_URL}/messages">Click here to view the offer</a></p>`,
    });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTradeOfferEmail,
};

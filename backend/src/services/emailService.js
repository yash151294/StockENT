const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
      from: `"StockENT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verify Your Email - StockENT',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to StockENT</h1>
          </div>
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with StockENT! To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account with StockENT, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      from: `"StockENT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset Your Password - StockENT',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Password Reset Request</h1>
          </div>
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for your StockENT account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, userData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"StockENT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Welcome to StockENT - Your Account is Verified!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to StockENT!</h1>
          </div>
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>Your Account is Now Active</h2>
            <p>Congratulations! Your email has been verified and your StockENT account is now active.</p>
            <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3>Account Details:</h3>
              <p><strong>Company:</strong> ${userData.companyName}</p>
              <p><strong>Role:</strong> ${userData.role}</p>
              <p><strong>Country:</strong> ${userData.country}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            <h3>What's Next?</h3>
            <ul>
              <li>Complete your company profile</li>
              <li>Browse available textile materials</li>
              <li>Start listing your products (if you're a seller)</li>
              <li>Connect with other businesses</li>
            </ul>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions, feel free to contact our support team.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    throw error;
  }
};

// Send product approval notification
const sendProductApprovalEmail = async (email, productData, approved) => {
  const statusText = approved ? 'approved' : 'rejected';

  try {
    const transporter = createTransporter();
    const subject = approved
      ? 'Product Approved - StockENT'
      : 'Product Rejected - StockENT';
    const statusColor = approved ? '#4caf50' : '#f44336';

    const mailOptions = {
      from: `"StockENT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
            <h1>Product ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h1>
          </div>
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>Your Product Has Been ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
            <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3>Product Details:</h3>
              <p><strong>Title:</strong> ${productData.title}</p>
              <p><strong>Price:</strong> $${productData.price}</p>
              <p><strong>Quantity:</strong> ${productData.quantity} ${productData.unit}</p>
            </div>
            ${
              approved
                ? `
              <p>Your product is now live and visible to potential buyers!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/products/${productData.id}" 
                   style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  View Product
                </a>
              </div>
            `
                : `
              <p>Unfortunately, your product did not meet our quality standards. Please review our guidelines and submit a new listing.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/products/create" 
                   style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Create New Product
                </a>
              </div>
            `
            }
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions about this decision, please contact our support team.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Product ${statusText} email sent to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send product ${statusText} email:`, error);
    throw error;
  }
};

// Send auction notification
const sendAuctionNotification = async (
  email,
  auctionData,
  notificationType
) => {
  try {
    const transporter = createTransporter();
    let subject, content;

    switch (notificationType) {
      case 'STARTED':
        subject = 'Auction Started - StockENT';
        content = `
          <h2>Your Auction Has Started!</h2>
          <p>The auction for "${auctionData.product.title}" is now live and accepting bids.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/auctions/${auctionData.id}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Auction
            </a>
          </div>
        `;
        break;
      case 'ENDING_SOON':
        subject = 'Auction Ending Soon - StockENT';
        content = `
          <h2>Auction Ending Soon!</h2>
          <p>The auction for "${auctionData.product.title}" is ending soon. Current highest bid: $${auctionData.currentBid}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/auctions/${auctionData.id}" 
               style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Place Bid Now
            </a>
          </div>
        `;
        break;
      case 'ENDED':
        subject = 'Auction Ended - StockENT';
        content = `
          <h2>Auction Ended</h2>
          <p>The auction for "${auctionData.product.title}" has ended. Final bid: $${auctionData.currentBid}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/auctions/${auctionData.id}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Results
            </a>
          </div>
        `;
        break;
      case 'RESTARTED':
        subject = 'Auction Restarted - StockENT';
        content = `
          <h2>Your Auction Has Been Restarted!</h2>
          <p>The auction for "${auctionData.product.title}" has been restarted and is now accepting new bids.</p>
          <p><strong>New Start Time:</strong> ${new Date(auctionData.startTime).toLocaleString()}</p>
          <p><strong>New End Time:</strong> ${new Date(auctionData.endTime).toLocaleString()}</p>
          <p><strong>Starting Price:</strong> $${auctionData.startingPrice}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/auctions/${auctionData.id}" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Restarted Auction
            </a>
          </div>
        `;
        break;
      default:
        return;
    }

    const mailOptions = {
      from: `"StockENT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>StockENT Auction</h1>
          </div>
          <div style="padding: 30px; background-color: #f5f5f5;">
            ${content}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              You're receiving this because you're watching this auction or have bid on it.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Auction ${notificationType} email sent to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send auction ${notificationType} email:`, error);
    throw error;
  }
};

// Send message notification
const sendMessageNotification = async (email, messageData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"StockENT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'New Message - StockENT',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>New Message</h1>
          </div>
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>You Have a New Message</h2>
            <p>You received a new message regarding "${messageData.product.title}".</p>
            <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <p><strong>From:</strong> ${messageData.sender.companyName}</p>
              <p><strong>Message:</strong> ${messageData.content}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/messages/${messageData.conversationId}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Message
              </a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Message notification email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send message notification email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendProductApprovalEmail,
  sendAuctionNotification,
  sendMessageNotification,
};

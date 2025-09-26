const nodemailer = require('nodemailer');
const { logger } = require('./logger');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send email verification
 * @param {string} email - User email
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">StockENT</h1>
          <p style="color: #666; margin: 5px 0;">B2B Textile Marketplace</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Welcome to StockENT!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with StockENT. To complete your registration and start trading 
            textile materials, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #1976d2;">${verificationUrl}</a>
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account with StockENT, 
            please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© 2024 StockENT. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
      Welcome to StockENT!
      
      Thank you for registering with StockENT. To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with StockENT, please ignore this email.
      
      Best regards,
      The StockENT Team
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify Your StockENT Account',
      html,
      text,
    });

    logger.info(`Verification email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">StockENT</h1>
          <p style="color: #666; margin: 5px 0;">B2B Textile Marketplace</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested a password reset for your StockENT account. Click the button below to reset your password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc004e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #1976d2;">${resetUrl}</a>
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request this password reset, 
            please ignore this email and your password will remain unchanged.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© 2024 StockENT. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
      Password Reset Request
      
      You requested a password reset for your StockENT account. Click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, please ignore this email and your password will remain unchanged.
      
      Best regards,
      The StockENT Team
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Reset Your StockENT Password',
      html,
      text,
    });

    logger.info(`Password reset email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send notification email
 * @param {string} email - User email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 */
const sendNotificationEmail = async (email, subject, message) => {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">StockENT</h1>
          <p style="color: #666; margin: 5px 0;">B2B Textile Marketplace</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <div style="color: #666; line-height: 1.6;">
            ${message}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© 2024 StockENT. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `StockENT - ${subject}`,
      html,
    });

    logger.info(`Notification email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending notification email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};

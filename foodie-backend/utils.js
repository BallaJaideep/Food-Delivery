import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Standardized success response
 */
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data })
  };
  return res.status(statusCode).json(response);
};

/**
 * Standardized error response
 */
export const sendError = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors })
  };
  return res.status(statusCode).json(response);
};

/**
 * Generate a cryptographically secure random token (hex string)
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a plain token using SHA-256 for secure database storage
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Email Transporter Setup
 */
let transporter = null;

export const getEmailTransporter = () => {
  if (!transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) === 465,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

/**
 * Send an email using Nodemailer with graceful fallback in development
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailer = getEmailTransporter();
    if (!mailer) {
      console.warn('[Email Warning] SMTP credentials not configured. Skipping email dispatch.');
      return { skipped: true };
    }

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"Foodie Platform" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log(`[Email Sent] Message sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Upload image to Cloudinary (or return URL directly)
 */
export const uploadImageToCloudinary = async (imageInput, folder = 'foodie_items') => {
  if (!imageInput) return null;
  // If already a hosted URL (http / https) and not a data URI, keep as is
  if (typeof imageInput === 'string' && imageInput.startsWith('http') && !imageInput.includes('base64')) {
    return imageInput;
  }

  try {
    const uploadRes = await cloudinary.uploader.upload(imageInput, {
      folder,
      resource_type: 'image'
    });
    return uploadRes.secure_url;
  } catch (err) {
    console.warn(`[Cloudinary Warning] Upload failed: ${err.message}. Retaining raw URL.`);
    return imageInput;
  }
};

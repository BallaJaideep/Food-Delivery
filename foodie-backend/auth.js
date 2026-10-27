import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Restaurant } from './models.js';
import {
  sendSuccess,
  sendError,
  generateSecureToken,
  hashToken,
  sendEmail
} from './utils.js';

const router = express.Router();

/**
 * Generate standard JWT
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Middleware: Verify JWT Authentication
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required. No Bearer token provided.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 401, 'Authentication token is empty or malformed.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 401, 'The user belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid authentication token.');
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Authentication token has expired. Please log in again.');
    }
    return sendError(res, 500, 'Authentication verification failed.', error.message);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Forbidden: Role '${req.user ? req.user.role : 'GUEST'}' is not authorized to access this resource.`
      );
    }
    next();
  };
};

// ==========================================
// 1. REGISTER
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, deliveryPartnerDetails } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Please provide name, email, and password.');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    // Security: Prevent public registration as ADMIN
    if (role && role.toUpperCase() === 'ADMIN') {
      return sendError(res, 403, 'Public registration as Administrator is not permitted.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 400, 'An account with this email address already exists.');
    }

    // Default to CUSTOMER if role not specified or validate allowed role
    const assignedRole = role ? role.toUpperCase() : 'CUSTOMER';
    const validPublicRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER'];
    if (!validPublicRoles.includes(assignedRole)) {
      return sendError(res, 400, `Invalid role. Allowed roles: ${validPublicRoles.join(', ')}`);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      phone: phone ? phone.trim() : undefined,
      deliveryPartnerDetails: assignedRole === 'DELIVERY_PARTNER' ? deliveryPartnerDetails : undefined
    });

    const token = generateToken(newUser._id, newUser.role);

    return sendSuccess(res, 201, 'User registered successfully', {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        deliveryPartnerDetails: newUser.deliveryPartnerDetails
      },
      token
    });
  } catch (error) {
    return sendError(res, 500, 'Registration failed', error.message);
  }
});

// ==========================================
// 2. LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide both email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user._id, user.role);

    return sendSuccess(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        deliveryPartnerDetails: user.deliveryPartnerDetails
      },
      token
    });
  } catch (error) {
    return sendError(res, 500, 'Login failed', error.message);
  }
});

// ==========================================
// 3. GET CURRENT USER (ME / PROFILE)
// ==========================================
router.get(['/me', '/profile'], verifyAuth, async (req, res) => {
  return sendSuccess(res, 200, 'Current user profile retrieved', {
    user: req.user
  });
});

// ==========================================
// 4. LOGOUT
// ==========================================
router.post('/logout', (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully. Clear your token on client.');
});

// ==========================================
// 5. FORGOT PASSWORD
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Please provide an email address.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Consistent response to prevent account enumeration
    const genericSuccessMsg =
      'If that email address is registered in our platform, a password reset link has been dispatched.';

    if (!user) {
      return sendSuccess(res, 200, genericSuccessMsg);
    }

    // Generate cryptographically secure reset token
    const resetToken = generateSecureToken(32);
    const hashedResetToken = hashToken(resetToken);

    // Token expires in 15 minutes
    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0D9488;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password for your Foodie Platform account. Click the button below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </p>
        <p>Or paste this link into your browser: <br><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this email.</p>
      </div>
    `;

    console.log(`\n======================================================`);
    console.log(`[AUTH DEV] Password Reset Token generated for: ${user.email}`);
    console.log(`[AUTH DEV] Reset Token: ${resetToken}`);
    console.log(`[AUTH DEV] Reset URL: ${resetUrl}`);
    console.log(`======================================================\n`);

    // Dispatch email (does not break flow if SMTP fails)
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Foodie Delivery Platform',
      text: `Reset your password at: ${resetUrl}. Link expires in 15 minutes.`,
      html: htmlContent
    });

    return sendSuccess(res, 200, genericSuccessMsg, {
      ...(process.env.NODE_ENV === 'development' && {
        devResetToken: resetToken,
        note: 'devResetToken is exposed strictly in development mode for automated Postman testing.'
      })
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to process forgot password request', error.message);
  }
});

// ==========================================
// 6. RESET PASSWORD
// ==========================================
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return sendError(res, 400, 'Password reset token is required in URL parameter.');
    }

    if (!password || password.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters.');
    }

    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match.');
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired password reset token.');
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return sendSuccess(res, 200, 'Password has been reset successfully. You can now log in.');
  } catch (error) {
    return sendError(res, 500, 'Failed to reset password', error.message);
  }
});

// ==========================================
// 7. SEED TEST USERS (DEVELOPMENT ONLY)
// ==========================================
router.post('/seed-test-users', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 403, 'Seeding is forbidden in production environment.');
    }

    const testAccounts = [
      {
        name: 'Alex Customer',
        email: 'customer@foodie.local',
        password: 'Customer@123',
        role: 'CUSTOMER',
        phone: '+91 9876543210'
      },
      {
        name: 'Sarah Owner',
        email: 'owner@foodie.local',
        password: 'Owner@123',
        role: 'RESTAURANT_OWNER',
        phone: '+91 9876543211'
      },
      {
        name: 'Restaurant Partner (Swiggy Multi-City Owner)',
        email: 'owner@gmail.com',
        password: 'Owner@123',
        role: 'RESTAURANT_OWNER',
        phone: '+91 9876543211'
      },
      {
        name: 'David Rider',
        email: 'rider@foodie.local',
        password: 'Rider@123',
        role: 'DELIVERY_PARTNER',
        phone: '+91 9876543212',
        deliveryPartnerDetails: {
          vehicleType: 'MOTORBIKE',
          isAvailable: true
        }
      },
      {
        name: 'Platform Administrator',
        email: 'admin@foodie.local',
        password: 'Admin@123',
        role: 'ADMIN',
        phone: '+91 9876543213'
      }
    ];

    const results = [];

    for (const acc of testAccounts) {
      const existing = await User.findOne({ email: acc.email });
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(acc.password, salt);

      if (existing) {
        existing.name = acc.name;
        existing.password = hashedPassword;
        existing.role = acc.role;
        existing.phone = acc.phone;
        existing.isActive = true;
        if (acc.deliveryPartnerDetails) {
          existing.deliveryPartnerDetails = acc.deliveryPartnerDetails;
        }
        await existing.save();
        results.push({ email: acc.email, role: acc.role, password: acc.password, status: 'UPDATED' });
      } else {
        const created = await User.create({
          name: acc.name,
          email: acc.email,
          password: hashedPassword,
          role: acc.role,
          phone: acc.phone,
          deliveryPartnerDetails: acc.deliveryPartnerDetails
        });
        results.push({ email: created.email, role: created.role, password: acc.password, status: 'CREATED' });
      }
    }

    // Ensure sample restaurant is attached to the test restaurant owner
    const ownerUser = await User.findOne({ email: 'owner@foodie.local' });
    let testRestaurant = await Restaurant.findOne({ owner: ownerUser._id });
    if (!testRestaurant) {
      testRestaurant = await Restaurant.create({
        name: 'Teal Bay Bistro',
        description: 'Modern coastal gourmet dining with fresh ingredients and fast delivery.',
        owner: ownerUser._id,
        cuisine: ['Continental', 'Seafood', 'Healthy Bowls'],
        address: {
          street: '12 Marina Promenade',
          city: 'Coastal City',
          state: 'State',
          postalCode: '500001'
        },
        phone: '+91 9876543211',
        isOpen: true,
        rating: 4.8,
        totalReviews: 24
      });
    }

    return sendSuccess(res, 200, 'Test accounts and sample restaurant seeded successfully', {
      accounts: results,
      testRestaurant: {
        id: testRestaurant._id,
        name: testRestaurant.name,
        ownerId: ownerUser._id
      }
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to seed test users', error.message);
  }
});

export default router;

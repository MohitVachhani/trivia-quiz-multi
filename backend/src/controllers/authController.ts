import { Request, Response, NextFunction } from 'express';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  sanitizeUser,
} from '../models/User';
import {
  hashPassword,
  generateToken,
  isValidEmail,
  isValidPassword,
} from '../services/authService';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/apiResponse';

/**
 * POST /api/auth/signup
 * Create a new user account
 */
export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw ApiError.badRequest(
        'MISSING_FIELDS',
        'Email and password are required'
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      throw ApiError.badRequest('INVALID_EMAIL', 'Invalid email format');
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      throw ApiError.badRequest(
        'WEAK_PASSWORD',
        passwordValidation.errors.join(', ')
      );
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw ApiError.conflict('EMAIL_EXISTS', 'Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser({ email, passwordHash });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Update last login
    await updateLastLogin(user.id);

    // Send response
    sendSuccess(
      res,
      {
        user: sanitizeUser(user),
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Note: Authentication is handled by Passport Local strategy in middleware
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User is already authenticated by Passport Local strategy
    // req.user contains { userId, email }
    const { userId, email } = req.user!;

    // Get full user details
    const user = await findUserById(userId);

    if (!user) {
      throw ApiError.unauthorized(
        'INVALID_CREDENTIALS',
        'Invalid email or password'
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Update last login
    await updateLastLogin(user.id);

    // Send response
    sendSuccess(res, {
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User is already authenticated by Passport JWT strategy
    // req.user contains { userId, email }
    const { userId } = req.user!;

    // Get full user details
    const user = await findUserById(userId);

    if (!user) {
      throw ApiError.unauthorized('UNAUTHORIZED', 'User not found');
    }

    // Send response
    sendSuccess(res, {
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

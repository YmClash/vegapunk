/**
 * Authentication Routes
 * Handles login, logout, token refresh, and user profile
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../middleware/asyncHandler';
import { authMiddleware, AuthRequest } from '@auth/middleware';
import { z } from 'zod';
import { createLogger } from '@utils/logger';

const logger = createLogger('AuthRoutes');

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
    name: z.string().min(2).max(100),
    role: z.enum(['admin', 'user', 'viewer']).optional()
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string()
  })
});

// Mock user store (replace with database in production)
const users = new Map();
const refreshTokens = new Map();

export const authRoutes = Router();

/**
 * POST /auth/register
 * Register a new user
 */
authRoutes.post('/register',
  validateRequest(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role = 'user' } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        success: false,
        error: 'User Already Exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: `user-${Date.now()}`,
      email,
      password: hashedPassword,
      name,
      role,
      permissions: getPermissionsForRole(role),
      createdAt: new Date()
    };

    users.set(email, user);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken,
        refreshToken
      },
      message: 'User registered successfully'
    });
  })
);

/**
 * POST /auth/login
 * Authenticate user and get tokens
 */
authRoutes.post('/login',
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Get user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  })
);

/**
 * POST /auth/logout
 * Logout user and invalidate refresh token
 */
authRoutes.post('/logout',
  authMiddleware(process.env.JWT_SECRET || 'vegapunk-secret-key'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token
      refreshTokens.delete(refreshToken);
    }

    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
authRoutes.post('/refresh',
  validateRequest(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    // Validate refresh token
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Refresh Token',
        message: 'The refresh token is invalid or expired'
      });
    }

    // Get user
    const user = Array.from(users.values()).find(u => u.id === tokenData.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User Not Found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  })
);

/**
 * GET /auth/profile
 * Get current user profile
 */
authRoutes.get('/profile',
  authMiddleware(process.env.JWT_SECRET || 'vegapunk-secret-key'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = Array.from(users.values()).find(u => u.id === req.user!.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt
      }
    });
  })
);

/**
 * PUT /auth/profile
 * Update current user profile
 */
authRoutes.put('/profile',
  authMiddleware(process.env.JWT_SECRET || 'vegapunk-secret-key'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    
    const user = Array.from(users.values()).find(u => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    // Update user
    if (name) {
      user.name = name;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'Profile updated successfully'
    });
  })
);

// Helper functions
function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    process.env.JWT_SECRET || 'vegapunk-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
}

function generateRefreshToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'vegapunk-refresh-secret',
    {
      expiresIn: '7d'
    }
  );
}

function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: [
      'agents.read', 'agents.write', 'agents.delete',
      'tasks.read', 'tasks.write', 'tasks.delete',
      'collaborations.read', 'collaborations.write', 'collaborations.delete',
      'system.read', 'system.write',
      'users.read', 'users.write', 'users.delete'
    ],
    user: [
      'agents.read', 'agents.write',
      'tasks.read', 'tasks.write',
      'collaborations.read', 'collaborations.write',
      'system.read'
    ],
    viewer: [
      'agents.read',
      'tasks.read',
      'collaborations.read',
      'system.read'
    ]
  };

  return permissions[role] || permissions.viewer;
}
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateTokens } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return validationErrorResponse('Email and password are required');
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        employee: true,
      },
    });

    if (!user) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse('ACCOUNT_DISABLED', 'Your account has been disabled', 403);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const { passwordHash, ...userWithoutPassword } = user;

    return successResponse({
      user: userWithoutPassword,
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to login', 500);
  }
}

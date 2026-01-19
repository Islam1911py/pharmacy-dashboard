import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateTokens } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role = 'employee' } = body;

    // Validation
    if (!name || !email || !password) {
      return validationErrorResponse('Name, email, and password are required');
    }

    if (password.length < 6) {
      return validationErrorResponse('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        user,
        tokens,
      },
      undefined
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to register user', 500);
  }
}

import { NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/rbac';
import { db } from '@/lib/db';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Get full user data
    const user = await db.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            department: true,
            managerId: true,
          },
        },
      },
    });

    if (!user) {
      return unauthorizedResponse();
    }

    return successResponse({ user });
  } catch (error) {
    console.error('Get me error:', error);
    return unauthorizedResponse();
  }
}

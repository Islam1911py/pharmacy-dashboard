import { NextRequest } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('MISSING_TOKEN', 'Refresh token is required', 400);
    }

    const newAccessToken = refreshAccessToken(refreshToken);

    if (!newAccessToken) {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    }

    return successResponse({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to refresh token', 500);
  }
}

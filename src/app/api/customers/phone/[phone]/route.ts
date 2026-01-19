import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/customers/phone/[phone] - Get or create customer by phone
export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'customers.view')) {
      return forbiddenResponse();
    }

    let customer = await db.customer.findUnique({
      where: { phone: params.phone },
    });

    return successResponse(customer);
  } catch (error) {
    console.error('Get customer by phone error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch customer', 500);
  }
}

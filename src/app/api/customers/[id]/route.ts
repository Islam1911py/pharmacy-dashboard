import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const customer = await db.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return notFoundResponse('Customer not found');
    }

    return successResponse(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch customer', 500);
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'customers.update')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { name, phone, address } = body;

    // Check if customer exists
    const existingCustomer = await db.customer.findUnique({
      where: { id: params.id },
    });

    if (!existingCustomer) {
      return notFoundResponse('Customer not found');
    }

    // Update customer
    const customer = await db.customer.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address !== undefined && { address }),
      },
    });

    return successResponse(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update customer', 500);
  }
}

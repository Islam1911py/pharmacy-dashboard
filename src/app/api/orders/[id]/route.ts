import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission, canAccessOrder } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

// GET /api/orders/[id] - Get single order
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

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        returns: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if user can access this order
    if (!canAccessOrder(userPayload.role as any, userPayload.userId, order.assignedTo)) {
      return forbiddenResponse();
    }

    if (!hasPermission(userPayload.role as any, 'orders.view')) {
      return forbiddenResponse();
    }

    return successResponse(order);
  } catch (error) {
    console.error('Get order error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch order', 500);
  }
}

// PUT /api/orders/[id] - Update order
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

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!existingOrder) {
      return notFoundResponse('Order not found');
    }

    // Check if user can access this order
    if (!canAccessOrder(userPayload.role as any, userPayload.userId, existingOrder.assignedTo)) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { status, deliveryAddress, notes, assignedTo } = body;

    // Check permissions based on what's being updated
    if (status && !hasPermission(userPayload.role as any, 'orders.update_status')) {
      return forbiddenResponse();
    }

    if (assignedTo && !hasPermission(userPayload.role as any, 'orders.update_assigned')) {
      return forbiddenResponse();
    }

    // Update order
    const order = await db.order.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(deliveryAddress !== undefined && { deliveryAddress }),
        ...(notes !== undefined && { notes }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return successResponse(order);
  } catch (error) {
    console.error('Update order error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update order', 500);
  }
}

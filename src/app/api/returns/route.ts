import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/returns - List returns
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'returns.view')) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get returns
    const [returns, total] = await Promise.all([
      db.return.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          product: true,
        },
      }),
      db.return.count({ where }),
    ]);

    return successResponse(returns, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get returns error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch returns', 500);
  }
}

// POST /api/returns - Create return
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'returns.create')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { orderId, productId, quantity, reason, notes } = body;

    // Validation
    if (!orderId || !productId || !quantity || !reason) {
      return errorResponse('VALIDATION_ERROR', 'Order ID, product ID, quantity, and reason are required', 400);
    }

    // Get order and check if product exists in order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return errorResponse('ORDER_NOT_FOUND', 'Order not found', 404);
    }

    const orderItem = order.orderItems.find(item => item.productId === productId);
    if (!orderItem) {
      return errorResponse('PRODUCT_NOT_IN_ORDER', 'Product not found in order', 400);
    }

    // Check if return quantity is valid
    if (quantity > orderItem.quantity) {
      return errorResponse(
        'INVALID_QUANTITY',
        `Return quantity cannot exceed order item quantity (${orderItem.quantity})`,
        400
      );
    }

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return errorResponse('PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    // Create return
    const returnRecord = await db.return.create({
      data: {
        orderId,
        productId,
        quantity: parseInt(quantity),
        reason,
        notes,
      },
      include: {
        product: true,
        order: true,
      },
    });

    // Update product stock
    await db.product.update({
      where: { id: productId },
      data: { stockQuantity: product.stockQuantity + parseInt(quantity) },
    });

    // Log inventory change
    await db.inventoryLog.create({
      data: {
        productId,
        changeQuantity: parseInt(quantity),
        reason: 'return',
        referenceId: returnRecord.id,
        notes: `Return for order ${orderId}`,
      },
    });

    return successResponse(returnRecord);
  } catch (error) {
    console.error('Create return error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to create return', 500);
  }
}

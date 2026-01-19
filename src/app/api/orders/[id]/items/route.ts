import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission, canAccessOrder } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

// POST /api/orders/[id]/items - Add item to order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'orders.update')) {
      return forbiddenResponse();
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: params.id },
      include: {
        orderItems: true,
      },
    });

    if (!existingOrder) {
      return notFoundResponse('Order not found');
    }

    // Only allow adding items to pending orders
    if (existingOrder.status !== 'pending') {
      return errorResponse('INVALID_STATUS', 'Can only add items to pending orders', 400);
    }

    const body = await request.json();
    const { productId, quantity } = body;

    // Validation
    if (!productId || !quantity) {
      return errorResponse('VALIDATION_ERROR', 'Product ID and quantity are required', 400);
    }

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return errorResponse('PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    // Check stock
    if (product.stockQuantity < quantity) {
      return errorResponse('INSUFFICIENT_STOCK', 'Insufficient stock', 400);
    }

    // Check if item already exists in order
    const existingItem = existingOrder.orderItems.find(item => item.productId === productId);
    if (existingItem) {
      return errorResponse('ITEM_EXISTS', 'Item already exists in order', 400);
    }

    const subtotal = product.price * quantity;

    // Add item to order
    const orderItem = await db.orderItem.create({
      data: {
        orderId: params.id,
        productId,
        quantity,
        unitPrice: product.price,
        subtotal,
      },
      include: {
        product: true,
      },
    });

    // Update order total
    const newTotal = existingOrder.totalPrice + subtotal;

    await db.order.update({
      where: { id: params.id },
      data: {
        totalPrice: newTotal,
        remainingAmount: newTotal - existingOrder.paidAmount,
      },
    });

    // Update product stock
    await db.product.update({
      where: { id: productId },
      data: { stockQuantity: product.stockQuantity - quantity },
    });

    // Log inventory change
    await db.inventoryLog.create({
      data: {
        productId,
        changeQuantity: -quantity,
        reason: 'sale',
        referenceId: params.id,
        notes: `Add item to order ${params.id}`,
      },
    });

    return successResponse(orderItem);
  } catch (error) {
    console.error('Add order item error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to add order item', 500);
  }
}

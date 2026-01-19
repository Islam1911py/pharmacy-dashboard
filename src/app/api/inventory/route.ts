import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/inventory - Get inventory logs
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'inventory.view')) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const productId = searchParams.get('productId');
    const reason = searchParams.get('reason');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (reason) {
      where.reason = reason;
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

    // Get inventory logs
    const [logs, total] = await Promise.all([
      db.inventoryLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
        },
      }),
      db.inventoryLog.count({ where }),
    ]);

    return successResponse(logs, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get inventory logs error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch inventory logs', 500);
  }
}

// POST /api/inventory/adjust - Adjust inventory
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'inventory.adjust')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { productId, changeQuantity, reason, notes, referenceId } = body;

    // Validation
    if (!productId || !changeQuantity || !reason) {
      return errorResponse('VALIDATION_ERROR', 'Product ID, change quantity, and reason are required', 400);
    }

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return errorResponse('PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    // Calculate new quantity
    const newQuantity = product.stockQuantity + parseInt(changeQuantity);

    if (newQuantity < 0) {
      return errorResponse('INVALID_QUANTITY', 'Stock cannot be negative', 400);
    }

    // Update product stock
    await db.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
    });

    // Log inventory change
    const log = await db.inventoryLog.create({
      data: {
        productId,
        changeQuantity: parseInt(changeQuantity),
        reason,
        referenceId,
        notes,
      },
      include: {
        product: true,
      },
    });

    return successResponse(log);
  } catch (error) {
    console.error('Adjust inventory error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to adjust inventory', 500);
  }
}

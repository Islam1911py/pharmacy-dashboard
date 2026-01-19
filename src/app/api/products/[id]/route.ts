import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

// GET /api/products/[id] - Get single product
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

    if (!hasPermission(userPayload.role as any, 'products.view')) {
      return forbiddenResponse();
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    return successResponse(product);
  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch product', 500);
  }
}

// PUT /api/products/[id] - Update product
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

    if (!hasPermission(userPayload.role as any, 'products.update')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { name, category, description, activeIngredient, dosageForm, price, isActive } = body;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return notFoundResponse('Product not found');
    }

    // Update product
    const product = await db.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(activeIngredient && { activeIngredient }),
        ...(dosageForm && { dosageForm }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return successResponse(product);
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update product', 500);
  }
}

// DELETE /api/products/[id] - Delete product (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'products.delete')) {
      return forbiddenResponse();
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return notFoundResponse('Product not found');
    }

    // Soft delete
    await db.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to delete product', 500);
  }
}

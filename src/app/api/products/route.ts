import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/products - List products
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Check permissions
    if (!hasPermission(userPayload.role as any, 'products.view')) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { activeIngredient: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStockOnly) {
      where.stockQuantity = { lte: db.product.fields.lowStockThreshold };
    }

    // Get products
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({ where }),
    ]);

    return successResponse(products, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch products', 500);
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Check permissions
    if (!hasPermission(userPayload.role as any, 'products.create')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const {
      name,
      category,
      description,
      activeIngredient,
      dosageForm,
      price,
      stockQuantity = 0,
      lowStockThreshold = 10,
    } = body;

    // Validation
    if (!name || !category || !activeIngredient || !dosageForm || !price) {
      return errorResponse('VALIDATION_ERROR', 'Missing required fields', 400);
    }

    // Create product
    const product = await db.product.create({
      data: {
        name,
        category,
        description,
        activeIngredient,
        dosageForm,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity),
        lowStockThreshold: parseInt(lowStockThreshold),
      },
    });

    // Log inventory change
    await db.inventoryLog.create({
      data: {
        productId: product.id,
        changeQuantity: parseInt(stockQuantity),
        reason: 'restock',
        notes: 'Initial stock',
      },
    });

    return successResponse(product);
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to create product', 500);
  }
}

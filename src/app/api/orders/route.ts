import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'orders.view')) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
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

    // Get orders
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      db.order.count({ where }),
    ]);

    return successResponse(orders, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch orders', 500);
  }
}

// POST /api/orders - Create order with stock checking
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'orders.create')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { customerId, items, deliveryAddress, notes, assignedTo } = body;

    // Validation
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Customer ID and items are required', 400);
    }

    // Check if customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
    }

    // Check stock for all products
    const outOfStockItems: any[] = [];
    const itemsWithStock = await Promise.all(
      items.map(async (item: any) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const isAvailable = product.stockQuantity >= item.quantity;

        if (!isAvailable) {
          outOfStockItems.push({
            productId: product.id,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableQuantity: product.stockQuantity,
            activeIngredient: product.activeIngredient,
            category: product.category,
          });
        }

        return {
          ...item,
          product,
          isAvailable,
        };
      })
    );

    // If there are out of stock items, return alternatives suggestion
    if (outOfStockItems.length > 0) {
      // Find alternatives for out of stock products
      const itemsWithAlternatives = await Promise.all(
        outOfStockItems.map(async (outOfStockItem) => {
          // Find similar products by active ingredient or category
          const alternatives = await db.product.findMany({
            where: {
              AND: [
                { id: { not: outOfStockItem.productId } },
                { isActive: true },
                { stockQuantity: { gt: 0 } },
                {
                  OR: [
                    { activeIngredient: outOfStockItem.activeIngredient },
                    { category: outOfStockItem.category },
                  ],
                },
              ],
            },
            take: 5,
          });

          return {
            ...outOfStockItem,
            alternatives,
          };
        })
      );

      return successResponse({
        outOfStock: true,
        outOfStockItems: itemsWithAlternatives,
        message: 'Some products are out of stock. Alternatives suggested.',
      });
    }

    // All products available, create order
    const orderItems = items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: itemsWithStock.find((i: any) => i.productId === item.productId)!.product.price,
      subtotal:
        itemsWithStock.find((i: any) => i.productId === item.productId)!.product.price * item.quantity,
    }));

    const totalPrice = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await db.order.create({
      data: {
        customerId,
        totalPrice,
        paymentStatus: 'unpaid',
        remainingAmount: totalPrice,
        deliveryAddress,
        notes,
        assignedTo,
        orderItems: {
          create: orderItems,
        },
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

    // Update stock for all products
    await Promise.all(
      items.map(async (item: any) => {
        const product = itemsWithStock.find((i: any) => i.productId === item.productId)!.product;
        const newQuantity = product.stockQuantity - item.quantity;

        await db.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newQuantity },
        });

        // Log inventory change
        await db.inventoryLog.create({
          data: {
            productId: item.productId,
            changeQuantity: -item.quantity,
            reason: 'sale',
            referenceId: order.id,
            notes: `Order ${order.id}`,
          },
        });
      })
    );

    return successResponse(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse('SERVER_ERROR', error.message || 'Failed to create order', 500);
  }
}

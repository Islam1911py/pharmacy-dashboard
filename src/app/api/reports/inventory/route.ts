import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/reports/inventory - Inventory report
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'reports.view')) {
      return forbiddenResponse();
    }

    // Get all products
    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stockQuantity, 0);
    const totalValue = products.reduce((sum, product) => sum + product.price * product.stockQuantity, 0);

    // Low stock products
    const lowStockProducts = products.filter(
      product => product.stockQuantity <= product.lowStockThreshold
    );

    // Out of stock products
    const outOfStockProducts = products.filter(product => product.stockQuantity === 0);

    // Products by category
    const productsByCategory = products.reduce((acc: any, product) => {
      if (!acc[product.category]) {
        acc[product.category] = {
          category: product.category,
          count: 0,
          totalStock: 0,
          totalValue: 0,
        };
      }
      acc[product.category].count += 1;
      acc[product.category].totalStock += product.stockQuantity;
      acc[product.category].totalValue += product.price * product.stockQuantity;
      return acc;
    }, {});

    const productsByCategoryArray = Object.values(productsByCategory).sort((a: any, b: any) =>
      a.category.localeCompare(b.category)
    );

    // Top products by value
    const topProductsByValue = [...products]
      .sort((a, b) => b.price * b.stockQuantity - a.price * a.stockQuantity)
      .slice(0, 10);

    // Low stock products sorted by stock quantity
    const criticalLowStock = [...lowStockProducts]
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 10);

    // Get recent inventory logs
    const recentLogs = await db.inventoryLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
      },
    });

    // Inventory movements summary
    const logs = await db.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const movementsByReason = logs.reduce((acc: any, log) => {
      if (!acc[log.reason]) {
        acc[log.reason] = 0;
      }
      acc[log.reason] += Math.abs(log.changeQuantity);
      return acc;
    }, {});

    return successResponse({
      summary: {
        totalProducts,
        totalStock,
        totalValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        averagePrice: totalProducts > 0 ? totalValue / totalStock : 0,
      },
      lowStockProducts: criticalLowStock,
      outOfStockProducts: outOfStockProducts.slice(0, 10),
      productsByCategory: productsByCategoryArray,
      topProductsByValue,
      movementsByReason,
      recentLogs,
      allProducts: products,
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to generate inventory report', 500);
  }
}

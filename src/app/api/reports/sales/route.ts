import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/reports/sales - Sales report
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    // Build where clause
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get sales data
    const orders = await db.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalPaid = orders.reduce((sum, order) => sum + order.paidAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus = orders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Orders by payment status
    const ordersByPaymentStatus = orders.reduce((acc: any, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    // Top products by sales quantity
    const productSales: any = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.product.name,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSales[item.productId].totalQuantity += item.quantity;
        productSales[item.productId].totalRevenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Sales over time (group by date)
    const salesOverTime = orders.reduce((acc: any, order) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = { date: key, revenue: 0, orders: 0 };
      }
      acc[key].revenue += order.totalPrice;
      acc[key].orders += 1;

      return acc;
    }, {});

    const salesOverTimeArray = Object.values(salesOverTime).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    // Payments by method
    const paymentsByMethod: any = {};
    orders.forEach(order => {
      order.payments.forEach(payment => {
        if (!paymentsByMethod[payment.method]) {
          paymentsByMethod[payment.method] = 0;
        }
        paymentsByMethod[payment.method] += payment.amount;
      });
    });

    return successResponse({
      summary: {
        totalOrders,
        totalRevenue,
        totalPaid,
        totalPending: totalRevenue - totalPaid,
        averageOrderValue,
      },
      ordersByStatus,
      ordersByPaymentStatus,
      topProducts,
      salesOverTime: salesOverTimeArray,
      paymentsByMethod,
      recentOrders: orders.slice(0, 10),
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to generate sales report', 500);
  }
}

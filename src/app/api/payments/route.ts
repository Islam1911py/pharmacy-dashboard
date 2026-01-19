import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/payments - List payments
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'payments.view')) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const orderId = searchParams.get('orderId');
    const method = searchParams.get('method');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (method) {
      where.method = method;
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

    // Get payments
    const [payments, total] = await Promise.all([
      db.payment.findMany({
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
        },
      }),
      db.payment.count({ where }),
    ]);

    return successResponse(payments, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch payments', 500);
  }
}

// POST /api/payments - Create payment
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'payments.create')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { orderId, amount, method, notes } = body;

    // Validation
    if (!orderId || !amount || !method) {
      return errorResponse('VALIDATION_ERROR', 'Order ID, amount, and method are required', 400);
    }

    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return errorResponse('ORDER_NOT_FOUND', 'Order not found', 404);
    }

    // Check if payment amount is valid
    if (amount <= 0) {
      return errorResponse('INVALID_AMOUNT', 'Payment amount must be greater than 0', 400);
    }

    if (amount > order.remainingAmount) {
      return errorResponse(
        'EXCESS_AMOUNT',
        `Payment amount cannot exceed remaining amount (${order.remainingAmount})`,
        400
      );
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        orderId,
        amount: parseFloat(amount),
        method,
        notes,
      },
    });

    // Update order payment status
    const newPaidAmount = order.paidAmount + parseFloat(amount);
    const newRemainingAmount = order.remainingAmount - parseFloat(amount);

    let paymentStatus: any = order.paymentStatus;
    if (newRemainingAmount === 0) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus,
      },
    });

    return successResponse(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to create payment', 500);
  }
}

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'customers.view')) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Get customers
    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      db.customer.count({ where }),
    ]);

    return successResponse(customers, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch customers', 500);
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'customers.create')) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { name, phone, address } = body;

    // Validation
    if (!name || !phone) {
      return errorResponse('VALIDATION_ERROR', 'Name and phone are required', 400);
    }

    // Check if customer with phone already exists
    const existingCustomer = await db.customer.findUnique({
      where: { phone },
    });

    if (existingCustomer) {
      return errorResponse('CUSTOMER_EXISTS', 'Customer with this phone already exists', 409);
    }

    // Create customer
    const customer = await db.customer.create({
      data: {
        name,
        phone,
        address,
      },
    });

    return successResponse(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to create customer', 500);
  }
}

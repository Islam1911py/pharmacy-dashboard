import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta,
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse('FORBIDDEN', message, 403);
}

export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return errorResponse('NOT_FOUND', message, 404);
}

export function validationErrorResponse(message: string, details?: any): NextResponse {
  return errorResponse('VALIDATION_ERROR', message, 400, details);
}

export function serverErrorResponse(message: string = 'Internal server error'): NextResponse {
  return errorResponse('SERVER_ERROR', message, 500);
}

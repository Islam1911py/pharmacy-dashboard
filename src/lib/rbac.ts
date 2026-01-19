import { verifyToken, JWTPayload } from './auth';

export type Role = 'admin' | 'manager' | 'supervisor' | 'employee' | 'analyst' | 'delegate';

// Role permissions configuration
const ROLE_PERMISSIONS = {
  admin: ['*'], // Full access
  manager: ['products.*', 'customers.*', 'orders.*', 'payments.*', 'returns.*', 'reports.*', 'employees.*'],
  supervisor: ['orders.*', 'products.view', 'products.update', 'inventory.*', 'reports.view'],
  employee: ['orders.create', 'orders.update_status', 'products.view', 'customers.view'],
  analyst: ['reports.view', 'orders.view', 'products.view', 'customers.view'],
  delegate: ['orders.update_assigned', 'orders.update_status'],
};

// Check if user has permission
export function hasPermission(role: Role, permission: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];

  // Admin has all permissions
  if (rolePerms.includes('*')) {
    return true;
  }

  // Check for wildcard permission (e.g., products.*)
  if (permission.includes('.')) {
    const [resource] = permission.split('.');
    const wildcardPerm = `${resource}.*`;
    if (rolePerms.includes(wildcardPerm)) {
      return true;
    }
  }

  // Check for exact permission
  return rolePerms.includes(permission);
}

// Check multiple permissions (all must be true)
export function hasAllPermissions(role: Role, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Check multiple permissions (at least one must be true)
export function hasAnyPermission(role: Role, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Get user from request (API routes)
export function getUserFromToken(authHeader: string | null): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Check if user can access a specific order
export function canAccessOrder(userRole: Role, userId: string, orderAssignedTo?: string | null): boolean {
  // Admin and manager can access all orders
  if (userRole === 'admin' || userRole === 'manager') {
    return true;
  }

  // Supervisor can access all orders
  if (userRole === 'supervisor') {
    return true;
  }

  // Employee can access orders (limited to view/create)
  if (userRole === 'employee') {
    return true;
  }

  // Delegate can only access assigned orders
  if (userRole === 'delegate' && orderAssignedTo === userId) {
    return true;
  }

  // Analyst can view orders
  if (userRole === 'analyst') {
    return true;
  }

  return false;
}

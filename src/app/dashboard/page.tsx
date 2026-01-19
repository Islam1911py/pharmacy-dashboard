'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [orders, products, customers, salesReport, inventoryReport]: any = await Promise.all([
        api.get('/api/orders?page=1&limit=1'),
        api.get('/api/products?page=1&limit=1'),
        api.get('/api/customers?page=1&limit=1'),
        api.get('/api/reports/sales'),
        api.get('/api/reports/inventory'),
      ]);

      const lowStockCount = inventoryReport.data?.summary?.lowStockCount || 0;
      const pendingCount = orders.meta?.total || 0;

      setStats({
        totalOrders: salesReport.data?.summary?.totalOrders || 0,
        totalProducts: products.meta?.total || 0,
        totalCustomers: customers.meta?.total || 0,
        totalRevenue: salesReport.data?.summary?.totalRevenue || 0,
        pendingOrders: pendingCount,
        lowStockProducts: lowStockCount,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your pharmacy business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue.toFixed(2) || '0.00'}`}
          description="Total sales revenue"
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          description="Total number of orders"
          icon={ShoppingCart}
        />
        <StatCard
          title="Products"
          value={stats?.totalProducts || 0}
          description="Total products in inventory"
          icon={Package}
          warning={stats?.lowStockProducts ? `${stats.lowStockProducts} low stock` : undefined}
        />
        <StatCard
          title="Customers"
          value={stats?.totalCustomers || 0}
          description="Total registered customers"
          icon={Users}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <QuickActionCard
              title="Create Order"
              description="Create a new order for a customer"
              href="/dashboard/orders/new"
            />
            <QuickActionCard
              title="Add Product"
              description="Add a new product to inventory"
              href="/dashboard/products/new"
            />
            <QuickActionCard
              title="Add Customer"
              description="Register a new customer"
              href="/dashboard/customers/new"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: { value: number; isPositive: boolean };
  warning?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, warning }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.value}%
            </span>
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
        {warning && (
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
            {warning}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
}

function QuickActionCard({ title, description, href }: QuickActionCardProps) {
  return (
    <a href={href} className="block">
      <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </a>
  );
}

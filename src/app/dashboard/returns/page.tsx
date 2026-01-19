'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Package, User, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Return {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  order: {
    id: string;
    customer: {
      name: string;
      phone: string;
    };
  };
  product: {
    name: string;
    category: string;
    price: number;
  };
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const response: any = await api.get('/api/returns');
      setReturns(response.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch returns');
    } finally {
      setIsLoading(false);
    }
  };

  const getReasonColor = (reason: string) => {
    const colors: any = {
      'defective': 'destructive',
      'wrong_item': 'secondary',
      'customer_request': 'default',
      'expired': 'destructive',
      'other': 'outline',
    };
    return colors[reason.toLowerCase()] || 'outline';
  };

  const formatReason = (reason: string) => {
    return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const totalReturnedQuantity = returns.reduce((sum, r) => sum + r.quantity, 0);
  const totalReturnValue = returns.reduce((sum, r) => sum + (r.quantity * r.product.price), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Returns</h1>
          <p className="text-muted-foreground">Manage product returns and refunds</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total return requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Returned</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReturnedQuantity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total quantity returned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Value</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReturnValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total value of returns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Return History</CardTitle>
          <CardDescription>Showing {returns.length} returns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No returns found
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-medium">
                      #{returnItem.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      #{returnItem.order.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{returnItem.order.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {returnItem.order.customer.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{returnItem.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {returnItem.product.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {returnItem.quantity}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      ${(returnItem.quantity * returnItem.product.price).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getReasonColor(returnItem.reason)}>
                        {formatReason(returnItem.reason)}
                      </Badge>
                      {returnItem.notes && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          {returnItem.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(returnItem.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

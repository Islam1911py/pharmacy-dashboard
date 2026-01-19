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
import { CreditCard, DollarSign, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  notes?: string;
  createdAt: string;
  order: {
    id: string;
    totalPrice: number;
    customer: {
      name: string;
      phone: string;
    };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filterMethod]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      let url = '/api/payments';
      if (filterMethod) {
        url += `?method=${filterMethod}`;
      }
      const response: any = await api.get(url);
      setPayments(response.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: any = {
      cash: 'default',
      card: 'secondary',
      vodafone: 'destructive',
      other: 'outline',
    };
    return colors[method] || 'outline';
  };

  const formatPaymentMethod = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage payment records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.filter(p => p.method === 'cash').length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.filter(p => p.method === 'card').length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filterMethod === '' ? 'default' : 'outline'}
              onClick={() => setFilterMethod('')}
            >
              All Methods
            </Button>
            <Button
              variant={filterMethod === 'cash' ? 'default' : 'outline'}
              onClick={() => setFilterMethod('cash')}
            >
              Cash
            </Button>
            <Button
              variant={filterMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setFilterMethod('card')}
            >
              Card
            </Button>
            <Button
              variant={filterMethod === 'vodafone' ? 'default' : 'outline'}
              onClick={() => setFilterMethod('vodafone')}
            >
              Vodafone
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Showing {payments.length} payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      #{payment.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      #{payment.order.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{payment.order.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.order.customer.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getMethodColor(payment.method)}>
                        {formatPaymentMethod(payment.method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(payment.createdAt).toLocaleDateString()}
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

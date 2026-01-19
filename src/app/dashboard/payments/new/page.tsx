'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['cash', 'card', 'vodafone', 'other'];

interface Order {
  id: string;
  customerId: string;
  customer?: { name: string };
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    orderId: '',
    amount: '',
    method: 'cash',
    notes: '',
  });
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/api/orders?limit=100');
        setOrders(response.data.data || []);
      } catch (error) {
        toast.error('Failed to load orders');
      }
    };
    fetchOrders();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectedOrder = orders.find((o) => o.id === formData.orderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/payments', {
        orderId: formData.orderId,
        amount: parseFloat(formData.amount),
        method: formData.method,
        notes: formData.notes,
      });

      if (response.data.success) {
        toast.success('Payment recorded successfully');
        router.push('/dashboard/payments');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/payments" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Payments
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Record a new payment for an order</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Order *</label>
                <select
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order {o.id.slice(0, 8)} - Total: ${o.totalPrice.toFixed(2)} (Remaining: ${o.remainingAmount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-semibold">${selectedOrder.totalPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <p className="font-semibold text-red-600">${selectedOrder.remainingAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Already Paid:</span>
                      <p className="font-semibold">${selectedOrder.paidAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Amount to Pay ($) *</label>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={selectedOrder?.remainingAmount || 0}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Payment notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Link href="/dashboard/payments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading || !formData.orderId}>
                  {isLoading ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

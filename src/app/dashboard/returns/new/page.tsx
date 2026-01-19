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

interface Order {
  id: string;
  customer?: { name: string };
  totalPrice: number;
  status: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function NewReturnPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    orderId: '',
    productId: '',
    quantity: '',
    reason: '',
    notes: '',
  });
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/api/orders?limit=100'),
          api.get('/api/products?limit=100'),
        ]);
        setOrders(ordersRes.data.data || []);
        setProducts(productsRes.data.data || []);
      } catch (error) {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderId || !formData.productId || !formData.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/returns', {
        orderId: formData.orderId,
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        notes: formData.notes,
      });

      if (response.data.success) {
        toast.success('Return recorded successfully');
        router.push('/dashboard/returns');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record return');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/returns" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Returns
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Record Product Return</CardTitle>
            <CardDescription>Record a product return from an order</CardDescription>
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
                      Order {o.id.slice(0, 8)} - {o.customer?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Product *</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Return Reason *</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Reason</option>
                  <option value="defective">Defective</option>
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes about the return"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Link href="/dashboard/returns">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading || !formData.orderId || !formData.productId}>
                  {isLoading ? 'Recording...' : 'Record Return'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

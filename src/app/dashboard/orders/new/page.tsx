'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          api.get('/api/customers?limit=100'),
          api.get('/api/products?limit=100'),
        ]);
        setCustomers(customersRes.data.data || []);
        setProducts(productsRes.data.data || []);
      } catch (error) {
        toast.error('Failed to load customers and products');
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Please select product and quantity');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: parseInt(quantity),
      unitPrice: product.price,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || orderItems.length === 0) {
      toast.error('Please select customer and add items');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/orders', {
        customerId: selectedCustomer,
        items: orderItems,
        deliveryAddress,
        notes,
      });

      if (response.data.success) {
        toast.success('Order created successfully');
        router.push('/dashboard/orders');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/orders" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
            <CardDescription>Create a new order for a customer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Items Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Add Items to Order</h3>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <label className="block text-sm font-medium mb-2">Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ${p.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium mb-2">Qty</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-3 flex items-end">
                    <Button type="button" onClick={handleAddItem} className="w-full">
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {orderItems.length > 0 && (
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3">Product</th>
                        <th className="text-right p-3">Price</th>
                        <th className="text-right p-3">Qty</th>
                        <th className="text-right p-3">Total</th>
                        <th className="text-center p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{item.productName}</td>
                          <td className="text-right p-3">${item.unitPrice.toFixed(2)}</td>
                          <td className="text-right p-3">{item.quantity}</td>
                          <td className="text-right p-3">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                          <td className="text-center p-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50 font-semibold">
                        <td colSpan={3} className="p-3 text-right">
                          Total:
                        </td>
                        <td className="p-3 text-right">${getTotalPrice()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Address</label>
                <Input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 justify-end">
                <Link href="/dashboard/orders">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading || orderItems.length === 0}>
                  {isLoading ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

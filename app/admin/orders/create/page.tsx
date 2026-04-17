'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Loader2, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';

const MODULE_KEY = 'orders';

interface OrderItem {
  productId: Id<"products">;
  productName: string;
  quantity: number;
  price: number;
}

type PaymentMethod = 'COD' | 'BankTransfer' | 'VietQR' | 'CreditCard' | 'EWallet';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD' },
  { label: 'Chuyển khoản ngân hàng', value: 'BankTransfer' },
  { label: 'VietQR', value: 'VietQR' },
  { label: 'Thẻ tín dụng', value: 'CreditCard' },
  { label: 'Ví điện tử', value: 'EWallet' },
];

export default function CreateOrderPage() {
  const router = useRouter();
  // Use limited queries for dropdowns
  const customersData = useQuery(api.customers.listAll, { limit: 100 });
  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const createOrder = useMutation(api.orders.create);

  const [customerId, setCustomerId] = useState<Id<"customers"> | ''>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<Id<"products"> | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = customersData === undefined || productsData === undefined || fieldsData === undefined;

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  // Use Map for O(1) lookup
  const productMap = useMemo(() => {
    const map = new Map<string, { name: string; price: number; stock: number }>();
    productsData?.forEach(p => map.set(p._id, { name: p.name, price: p.salePrice ?? p.price, stock: p.stock }));
    return map;
  }, [productsData]);

  // Use Map for O(1) customer lookup
  const customerMap = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; address?: string }>();
    customersData?.forEach(c => map.set(c._id, { address: c.address, name: c.name, phone: c.phone }));
    return map;
  }, [customersData]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const totalAmount = subtotal + shippingFee;

  const addItem = () => {
    if (!selectedProductId) {return;}
    const product = productMap.get(selectedProductId);
    if (!product) {return;}

    const existingIndex = items.findIndex(i => i.productId === selectedProductId);
    if (existingIndex !== -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([...items, { price: product.price, productId: selectedProductId, productName: product.name, quantity }]);
    }
    setSelectedProductId('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {return;}
    const newItems = [...items];
    newItems[index].quantity = newQuantity;
    setItems(newItems);
  };

  const handleCustomerChange = (newCustomerId: string) => {
    setCustomerId(newCustomerId as Id<"customers">);
    const customer = customerMap.get(newCustomerId);
    if (customer?.address && enabledFields.has('shippingAddress')) {
      setShippingAddress(customer.address);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        customerId: customerId,
        items,
        note: enabledFields.has('note') ? note : undefined,
        paymentMethod: enabledFields.has('paymentMethod') && paymentMethod ? paymentMethod : undefined,
        shippingAddress: enabledFields.has('shippingAddress') ? shippingAddress : undefined,
        shippingFee: enabledFields.has('shippingFee') ? shippingFee : undefined,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Có lỗi xảy ra');
        return;
      }
      toast.success('Đã tạo đơn hàng thành công');
      router.push('/admin/orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon"><ArrowLeft size={20}/></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo đơn hàng mới</h1>
          <p className="text-sm text-slate-500">Tạo đơn hàng cho khách hàng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader><CardTitle>Khách hàng</CardTitle></CardHeader>
              <CardContent>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={customerId}
                  onChange={(e) =>{  handleCustomerChange(e.target.value); }}
                  required
                >
                  <option value="">Chọn khách hàng</option>
                  {customersData?.map(c => (
                    <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader><CardTitle>Sản phẩm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={selectedProductId}
                    onChange={(e) =>{  setSelectedProductId(e.target.value as Id<"products">); }}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {productsData?.filter(p => p.status === 'Active' && p.stock > 0).map(p => (
                      <option key={p._id} value={p._id}>{p.name} - {formatPrice(p.salePrice ?? p.price)} (Kho: {p.stock})</option>
                    ))}
                  </select>
                  <Input type="number" className="w-20" min={1} value={quantity} onChange={(e) =>{  setQuantity(Number.parseInt(e.target.value) || 1); }} />
                  <Button type="button" onClick={addItem} disabled={!selectedProductId}><Plus size={16}/></Button>
                </div>

                {items.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-slate-500">{formatPrice(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-16 h-8 text-center"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>{  updateItemQuantity(index, Number.parseInt(e.target.value) || 1); }}
                          />
                          <span className="font-medium w-28 text-right">{formatPrice(item.price * item.quantity)}</span>
                          <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() =>{  removeItem(index); }}>
                            <Trash2 size={16}/>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p>Chưa có sản phẩm nào</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Info */}
            {enabledFields.has('shippingAddress') && (
              <Card>
                <CardHeader><CardTitle>Thông tin giao hàng</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Địa chỉ giao hàng</Label>
                    <textarea
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                      value={shippingAddress}
                      onChange={(e) =>{  setShippingAddress(e.target.value); }}
                      placeholder="Nhập địa chỉ giao hàng"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Note */}
            {enabledFields.has('note') && (
              <Card>
                <CardHeader><CardTitle>Ghi chú</CardTitle></CardHeader>
                <CardContent>
                  <textarea
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    value={note}
                    onChange={(e) =>{  setNote(e.target.value); }}
                    placeholder="Ghi chú cho đơn hàng"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            {enabledFields.has('paymentMethod') && (
              <Card>
                <CardHeader><CardTitle>Thanh toán</CardTitle></CardHeader>
                <CardContent>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={paymentMethod}
                    onChange={(e) =>{  setPaymentMethod(e.target.value as PaymentMethod); }}
                  >
                    <option value="">Chọn phương thức</option>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader><CardTitle>Tổng cộng</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính ({items.length} SP):</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {enabledFields.has('shippingFee') && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Phí vận chuyển:</span>
                    <Input
                      type="number"
                      className="w-28 h-8 text-right"
                      min={0}
                      value={shippingFee}
                      onChange={(e) =>{  setShippingFee(Number.parseInt(e.target.value) || 0); }}
                    />
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Tổng tiền:</span>
                  <span className="text-emerald-600">{formatPrice(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500" disabled={isSubmitting || items.length === 0}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Tạo đơn hàng
              </Button>
              <Link href="/admin/orders">
                <Button type="button" variant="outline" className="w-full">Hủy</Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

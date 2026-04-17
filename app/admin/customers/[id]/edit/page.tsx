'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronLeft, ChevronRight, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';

const MODULE_KEY = 'customers';
const ORDERS_PER_PAGE = 10; // CUST-010: Add pagination constant

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// CUST-005 FIX: Add phone validation for Vietnamese phone numbers
const isValidPhone = (phone: string) => /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone.replaceAll(/\s|-/g, ''));

interface FormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  status: 'Active' | 'Inactive';
}

// CUST-009 FIX: Keep use(params) since this is 'use client' component - it's valid pattern
export default function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Convex queries
  const customerData = useQuery(api.customers.getById, { id: id as Id<"customers"> });
  const ordersData = useQuery(api.orders.listAllByCustomer, { customerId: id as Id<"customers"> });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });

  // Convex mutations
  const updateCustomer = useMutation(api.customers.update);

  // States
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1); // CUST-010: Add pagination state

  const isLoading = customerData === undefined;

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showNotes = enabledFeatures.enableNotes ?? true;
  const showAddresses = enabledFeatures.enableAddresses ?? true;
  const showAvatar = enabledFeatures.enableAvatar ?? true;

  // Sync form with customer data
  useEffect(() => {
    if (customerData && !formData) {
      setFormData({
        address: customerData.address ?? '',
        city: customerData.city ?? '',
        email: customerData.email,
        name: customerData.name,
        notes: customerData.notes ?? '',
        phone: customerData.phone,
        status: customerData.status,
      });
    }
  }, [customerData, formData]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) {return;}

    // Validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.email.trim() || !isValidEmail(formData.email.trim())) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    // CUST-005 FIX: Validate phone format
    if (!isValidPhone(formData.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCustomer({
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        email: formData.email.toLowerCase().trim(),
        id: id as Id<"customers">,
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
        phone: formData.phone.trim(),
        status: formData.status,
      });
      toast.success('Đã lưu thông tin khách hàng');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 mb-4">Không tìm thấy khách hàng</p>
        <Link href="/admin/customers">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông tin khách hàng</h1>
          <Link href="/admin/customers" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Profile Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden">
                {showAvatar && customerData.avatar ? (
                  <Image src={customerData.avatar} width={96} height={96} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                    <UserIcon className="w-12 h-12 text-purple-400" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{customerData.name}</h3>
              <p className="text-slate-500 text-sm mb-2">{customerData.email}</p>
              <Badge variant={customerData.status === 'Active' ? 'success' : 'secondary'}>
                {customerData.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
              </Badge>

              <div className="grid grid-cols-2 gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{customerData.ordersCount}</div>
                  <div className="text-xs text-slate-500">Đơn hàng</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(customerData.totalSpent)}
                  </div>
                  <div className="text-xs text-slate-500">Chi tiêu</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showNotes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Ghi chú nhanh</CardTitle></CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-32 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData?.notes ?? ''}
                  onChange={(e) =>{  handleChange('notes', e.target.value); }}
                  placeholder="Ghi chú về khách hàng..."
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() =>{  setActiveTab('profile'); }}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'profile' ? "border-purple-500 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Hồ sơ & Địa chỉ
            </button>
            <button
              onClick={() =>{  setActiveTab('orders'); }}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'orders' ? "border-purple-500 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Lịch sử mua hàng ({ordersData?.length ?? 0})
            </button>
          </div>

          {activeTab === 'profile' && formData && (
            <Card>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Họ và tên <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>{  handleChange('name', e.target.value); }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số điện thoại <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>{  handleChange('phone', e.target.value); }}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>{  handleChange('email', e.target.value); }}
                      required
                    />
                  </div>

                  {showAddresses && (
                    <>
                      <div className="space-y-2">
                        <Label>Địa chỉ</Label>
                        <Input
                          value={formData.address}
                          onChange={(e) =>{  handleChange('address', e.target.value); }}
                          placeholder="Số nhà, tên đường..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Thành phố / Tỉnh</Label>
                          <Input
                            value={formData.city}
                            onChange={(e) =>{  handleChange('city', e.target.value); }}
                            placeholder="Nhập thành phố..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Trạng thái</Label>
                          <select
                            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                            value={formData.status}
                            onChange={(e) =>{  handleChange('status', e.target.value); }}
                          >
                            <option value="Active">Hoạt động</option>
                            <option value="Inactive">Bị khóa</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {!showAddresses && (
                    <div className="space-y-2">
                      <Label>Trạng thái</Label>
                      <select
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        value={formData.status}
                        onChange={(e) =>{  handleChange('status', e.target.value); }}
                      >
                        <option value="Active">Hoạt động</option>
                        <option value="Inactive">Bị khóa</option>
                      </select>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/customers'); }}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="accent" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}

          {activeTab === 'orders' && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* CUST-010 FIX: Add pagination for orders */}
                  {ordersData?.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE).map(order => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <Link href={`/admin/orders/${order._id}/edit`} className="font-medium text-blue-600 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(order._creationTime).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.paymentStatus === 'Paid' ? 'success' :
                          order.paymentStatus === 'Failed' ? 'destructive' :
                          order.paymentStatus === 'Refunded' ? 'secondary' : 'warning'
                        }>
                          {order.paymentStatus === 'Paid' ? 'Đã thanh toán' :
                           order.paymentStatus === 'Failed' ? 'Thất bại' :
                           order.paymentStatus === 'Refunded' ? 'Hoàn tiền' : 'Chờ thanh toán'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'Delivered' ? 'success' :
                          order.status === 'Cancelled' ? 'destructive' :
                          order.status === 'Shipped' ? 'default' : 'warning'
                        }>
                          {order.status === 'Pending' ? 'Chờ xử lý' :
                           order.status === 'Processing' ? 'Đang xử lý' :
                           order.status === 'Shipped' ? 'Đang giao' :
                           order.status === 'Delivered' ? 'Hoàn thành' : 'Đã hủy'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!ordersData || ordersData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Chưa có đơn hàng nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* CUST-010 FIX: Pagination controls */}
              {ordersData && ordersData.length > ORDERS_PER_PAGE && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Hiển thị {(ordersPage - 1) * ORDERS_PER_PAGE + 1} - {Math.min(ordersPage * ORDERS_PER_PAGE, ordersData.length)} / {ordersData.length} đơn hàng
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage === 1}
                      onClick={() =>{  setOrdersPage(p => p - 1); }}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Trang {ordersPage} / {Math.ceil(ordersData.length / ORDERS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage >= Math.ceil(ordersData.length / ORDERS_PER_PAGE)}
                      onClick={() =>{  setOrdersPage(p => p + 1); }}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

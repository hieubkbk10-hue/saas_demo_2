'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Badge, Button, Card, CardContent, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';

const MODULE_KEY = 'productCategories';

export default function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const categoryData = useQuery(api.productCategories.getById, { id: id as Id<"productCategories"> });
  const categoriesData = useQuery(api.productCategories.listAll, {});
  const productsData = useQuery(api.products.listAll, {});
  const updateCategory = useMutation(api.productCategories.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const hierarchyFeature = useQuery(api.admin.modules.getModuleFeature, {
    featureKey: 'enableCategoryHierarchy',
    moduleKey: 'products',
  });

  const [activeTab, setActiveTab] = useState('info');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);
  const isHierarchyEnabled = hierarchyFeature?.enabled === true;

  const generateSlugFromName = (value: string) => value.toLowerCase()
    .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
    .replaceAll(/[đĐ]/g, "d")
    .replaceAll(/[^a-z0-9\s]/g, '')
    .replaceAll(/\s+/g, '-');

  useEffect(() => {
    if (categoryData) {
      setName(categoryData.name);
      setSlug(categoryData.slug);
      setDescription(categoryData.description ?? '');
      setParentId(categoryData.parentId ?? '');
      setActive(categoryData.active);
    }
  }, [categoryData]);

  const relatedProducts = useMemo(() => productsData?.filter(p => p.categoryId === id) ?? [], [productsData, id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(generateSlugFromName(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      await updateCategory({
        active,
        description: description.trim() || undefined,
        id: id as Id<"productCategories">,
        name: name.trim(),
        parentId: isHierarchyEnabled && parentId ? parentId as Id<"productCategories"> : undefined,
        slug: slug.trim(),
      });
      toast.success('Cập nhật danh mục thành công');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoryData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (categoryData === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy danh mục</div>;
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa danh mục</h1>
          <Link href="/admin/categories" className="text-sm text-orange-600 hover:underline">Quay lại danh sách</Link>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.open(`/products?category=${encodeURIComponent(slug)}`, '_blank')}>
          <ExternalLink size={16}/> Xem trên web
        </Button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() =>{  setActiveTab('info'); }}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'info' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Thông tin chung
        </button>
        <button
          onClick={() =>{  setActiveTab('products'); }}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'products' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Sản phẩm thuộc danh mục <Badge variant="secondary" className="ml-1">{relatedProducts.length}</Badge>
        </button>
      </div>

      {activeTab === 'info' ? (
        <Card className="max-w-md mx-auto md:mx-0">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Tên danh mục <span className="text-red-500">*</span></Label>
                <Input value={name} onChange={handleNameChange} required placeholder="Ví dụ: Điện thoại, Áo sơ mi..." autoFocus />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="slug" className="font-mono text-sm" />
              </div>
              
              {isHierarchyEnabled && (
                <div className="space-y-2">
                  <Label>Danh mục cha</Label>
                  <select 
                    value={parentId}
                    onChange={(e) =>{  setParentId(e.target.value); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {categoriesData?.filter(c => c._id !== id).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {enabledFields.has('description') && (
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <textarea
                    value={description}
                    onChange={(e) =>{  setDescription(e.target.value); }}
                    placeholder="Mô tả ngắn về danh mục..."
                    className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  value={active ? 'active' : 'inactive'}
                  onChange={(e) =>{  setActive(e.target.value === 'active'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ẩn</option>
                </select>
              </div>
            </CardContent>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/categories'); }}>Hủy bỏ</Button>
              <Button type="submit" variant="accent" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedProducts.map(prod => (
                <TableRow key={prod._id}>
                  <TableCell>
                    {prod.image ? (
                      <Image src={prod.image} width={40} height={40} className="object-cover rounded bg-slate-100" alt="" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{prod.name}</TableCell>
                  <TableCell>
                    {prod.salePrice ? (
                      <span className="text-red-500">{formatPrice(prod.salePrice)}</span>
                    ) : (
                      formatPrice(prod.price)
                    )}
                  </TableCell>
                  <TableCell className={prod.stock < 10 ? 'text-red-500 font-medium' : ''}>{prod.stock}</TableCell>
                  <TableCell>
                    <Badge variant={prod.status === 'Active' ? 'success' : 'secondary'}>
                      {prod.status === 'Active' ? 'Đang bán' : (prod.status === 'Draft' ? 'Nháp' : 'Lưu trữ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${prod._id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8">Sửa</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {relatedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Chưa có sản phẩm nào trong danh mục này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

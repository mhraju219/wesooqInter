'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Category {
  id: string;
  name: any;
  slug: string;
  businessCategory: string;
  parentId: string | null;
  children: Category[];
}

interface CatalogProduct {
  id: string;
  barcode: string;
  name: any;
  description?: any;
  category: string;
  categoryId?: string | null;
  images: string[];
  isActive: boolean;
}

interface CatalogManagerProps {
  initialProducts: CatalogProduct[];
}

export function CatalogManager({ initialProducts }: CatalogManagerProps) {
  const { locale } = useLanguage(); // 'en' or 'ar'
  const isRTL = locale === 'ar';
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    barcode: '',
    nameEn: '',
    nameAr: '',
    category: 'SUPERMARKET',
    categoryId: '',
    descriptionEn: '',
    descriptionAr: '',
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const businessCategories = [
    'HOSPITAL', 'SUPERMARKET', 'RESTAURANT', 'ELECTRONICS',
    'FLOWER_SHOP', 'MOBILE_ACCESSORIES', 'VEHICLES'
  ];

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      const res = await fetch(`/api/admin/catalog-products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.items);
    } catch (error) {
      toast.error(isRTL ? 'فشل تحميل المنتجات' : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, isRTL]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
      toast.success(isRTL ? 'تم رفع الصورة' : 'Image uploaded');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      nameEn: '',
      nameAr: '',
      category: 'SUPERMARKET',
      categoryId: '',
      descriptionEn: '',
      descriptionAr: '',
      imageUrl: '',
    });
    setImagePreview('');
  };

  const handleAdd = async () => {
    if (!formData.barcode || !formData.nameEn) {
      toast.error(isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalog-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: formData.barcode,
          name: { en: formData.nameEn, ar: formData.nameAr || '' },
          description: { en: formData.descriptionEn, ar: formData.descriptionAr || '' },
          category: formData.category,
          categoryId: formData.categoryId || null,
          images: formData.imageUrl ? [formData.imageUrl] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isRTL ? 'تمت الإضافة' : 'Product added');
      setIsAddOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setFormData({
      barcode: product.barcode,
      nameEn: product.name?.en || '',
      nameAr: product.name?.ar || '',
      category: product.category,
      categoryId: product.categoryId || '',
      descriptionEn: product.description?.en || '',
      descriptionAr: product.description?.ar || '',
      imageUrl: product.images?.[0] || '',
    });
    setImagePreview(product.images?.[0] || '');
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/catalog-products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: formData.nameEn, ar: formData.nameAr || '' },
          description: { en: formData.descriptionEn, ar: formData.descriptionAr || '' },
          category: formData.category,
          categoryId: formData.categoryId || null,
          images: formData.imageUrl ? [formData.imageUrl] : [],
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(isRTL ? 'تم التحديث' : 'Product updated');
      setIsEditOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/catalog-products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(isRTL ? 'تم الحذف' : 'Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // Build category tree options
  const getCategoryOptions = (cats: Category[], parentId: string | null = null, level = 0) => {
    let options: { id: string; name: string; level: number }[] = [];
    const filtered = cats.filter(c => c.parentId === parentId && c.businessCategory === formData.category);
    for (const cat of filtered) {
      options.push({ id: cat.id, name: cat.name?.en || cat.name?.ar, level });
      options.push(...getCategoryOptions(cats, cat.id, level + 1));
    }
    return options;
  };
  const categoryOptions = getCategoryOptions(categories);

  // Helper for text alignment in table
  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const headerClass = `font-semibold ${textAlignClass}`;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{isRTL ? 'مدير الكتالوج' : 'Catalog Manager'}</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {isRTL ? 'إضافة منتج' : 'Add Product'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إضافة منتج جديد' : 'Add New Catalog Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isRTL ? 'الباركود *' : 'Barcode *'}</Label>
                <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
                  <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
                </div>
                <div>
                  <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{isRTL ? 'الفئة الرئيسية *' : 'Business Category *'}</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, categoryId: '' })}
                >
                  {businessCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{isRTL ? 'الفئة الفرعية (اختياري)' : 'Sub‑Category (optional)'}</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">{isRTL ? 'لا شيء' : 'None'}</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {'—'.repeat(opt.level)} {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                  <textarea
                    dir="rtl"
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{isRTL ? 'صورة المنتج' : 'Product Image'}</Label>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? (isRTL ? 'جاري الرفع...' : 'Uploading...') : (isRTL ? 'رفع صورة' : 'Upload Image')}
                  </Button>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageUpload(file);
                    }}
                  />
                  {imagePreview && (
                    <div className="relative">
                      <Image src={imagePreview} alt="Preview" width={64} height={64} className="h-16 w-16 object-cover rounded border" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' });
                          setImagePreview('');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? 'صورة واحدة فقط. الحجم الموصى به: 500×500 بكسل' : 'Only one image. Recommended size: 500x500px.'}
                </p>
              </div>
              <Button onClick={handleAdd} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRTL ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters - responsive stacking */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'بحث بالباركود أو الاسم' : 'Search by barcode or name'}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md p-2"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">{isRTL ? 'جميع الفئات' : 'All Categories'}</option>
          {businessCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table - responsive overflow */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={headerClass}>{isRTL ? 'الباركود' : 'Barcode'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الفئة' : 'Category'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الصورة' : 'Image'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {isRTL ? 'لا توجد منتجات' : 'No products found'}
                </TableCell>
              </TableRow>
            ) : (
              products.map(p => (
                <TableRow key={p.id}>
                  <TableCell className={`font-mono text-xs ${textAlignClass}`}>{p.barcode}</TableCell>
                  <TableCell className={textAlignClass}>{p.name?.en || '-'}</TableCell>
                  <TableCell className="text-right" dir="rtl">{p.name?.ar || '-'}</TableCell>
                  <TableCell className={textAlignClass}><Badge variant="outline">{p.category}</Badge></TableCell>
                  <TableCell className={textAlignClass}>
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name?.en} width={40} height={40} className="h-10 w-10 object-cover rounded" />
                    ) : '—'}
                  </TableCell>
                  <TableCell className={textAlignClass}>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className={textAlignClass}>
                    <div className="flex gap-2 justify-start rtl:justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل المنتج' : 'Edit Catalog Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
                <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{isRTL ? 'الفئة الرئيسية' : 'Business Category'}</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, categoryId: '' })}
              >
                {businessCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{isRTL ? 'الفئة الفرعية (اختياري)' : 'Sub‑Category (optional)'}</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">{isRTL ? 'لا شيء' : 'None'}</option>
                {categoryOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {'—'.repeat(opt.level)} {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                />
              </div>
              <div>
                <Label>{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <textarea
                  dir="rtl"
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>{isRTL ? 'صورة المنتج' : 'Product Image'}</Label>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('editImageUpload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? (isRTL ? 'جاري الرفع...' : 'Uploading...') : (isRTL ? 'تغيير الصورة' : 'Change Image')}
                </Button>
                <input
                  id="editImageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleImageUpload(file);
                  }}
                />
                {imagePreview && (
                  <div className="relative">
                    <Image src={imagePreview} alt="Preview" width={64} height={64} className="h-16 w-16 object-cover rounded border" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      onClick={() => {
                        setFormData({ ...formData, imageUrl: '' });
                        setImagePreview('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? 'صورة واحدة فقط. الحجم الموصى به: 500×500 بكسل' : 'Only one image. Recommended size: 500x500px.'}
              </p>
            </div>

            <Button onClick={handleEdit} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'تحديث' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
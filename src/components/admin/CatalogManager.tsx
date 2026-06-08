'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, Upload, QrCode, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// ... (interfaces remain the same) ...

interface BusinessCategory {
  id: string;
  name: any;
  slug: string;
}

interface SubCategory {
  id: string;
  name: any;
  slug: string;
  businessCategoryId: string;
  parentId: string | null;
  children?: SubCategory[];
}

interface CatalogProduct {
  id: string;
  barcode: string;
  name: any;
  description?: any;
  businessCategoryId: string;
  categoryId?: string | null;
  images: string[];
  isActive: boolean;
}

interface CatalogManagerProps {
  initialProducts: CatalogProduct[];
}

function generateRandomBarcode(): string {
  const prefix = '629';
  const randomPart = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return prefix + randomPart;
}

export default function CatalogManager({ initialProducts }: CatalogManagerProps) {
  const { locale } = useLanguage();
  const isRTL = locale === 'ar';

  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState('');
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [selectedBusinessCatId, setSelectedBusinessCatId] = useState('');
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [modalSubCategories, setModalSubCategories] = useState<SubCategory[]>([]);
  const [formData, setFormData] = useState({
    barcode: '',
    nameEn: '',
    nameAr: '',
    businessCategoryId: '',
    categoryId: '',
    descriptionEn: '',
    descriptionAr: '',
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [barcodeValid, setBarcodeValid] = useState(true);
  const [barcodeChecking, setBarcodeChecking] = useState(false);

  // New business category modal
  const [isNewBizCatOpen, setIsNewBizCatOpen] = useState(false);
  const [newBizCatNameEn, setNewBizCatNameEn] = useState('');
  const [newBizCatNameAr, setNewBizCatNameAr] = useState('');
  const [creatingBizCat, setCreatingBizCat] = useState(false);

  // New sub‑category modal
  const [isNewSubCatOpen, setIsNewSubCatOpen] = useState(false);
  const [newSubCatNameEn, setNewSubCatNameEn] = useState('');
  const [newSubCatNameAr, setNewSubCatNameAr] = useState('');
  const [creatingSubCat, setCreatingSubCat] = useState(false);

  // Fetch business categories
  const fetchBusinessCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/business-categories');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBusinessCategories(data);
    } catch (error) {
      toast.error(isRTL ? 'فشل تحميل الفئات التجارية' : 'Failed to load business categories');
    }
  }, [isRTL]);

  // Fetch sub‑categories for the filter (based on selected business category)
  const fetchSubCategories = useCallback(async () => {
    if (!selectedBusinessCatId) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/categories?businessCategoryId=${selectedBusinessCatId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubCategories(data);
    } catch (error) {
      console.error('Failed to load sub‑categories');
    }
  }, [selectedBusinessCatId]);

  // Fetch sub‑categories for the modal (based on the form's business category)
  const fetchModalSubCategories = useCallback(async (businessCategoryId: string) => {
    if (!businessCategoryId) {
      setModalSubCategories([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/categories?businessCategoryId=${businessCategoryId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setModalSubCategories(data);
    } catch (error) {
      console.error('Failed to load sub‑categories for modal');
      setModalSubCategories([]);
    }
  }, []);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedBusinessCatId) params.append('businessCategoryId', selectedBusinessCatId);
      const res = await fetch(`/api/admin/catalog-products?${params.toString()}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const data = await res.json();
      setProducts(data.items);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error(error.message || (isRTL ? 'فشل تحميل المنتجات' : 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [search, selectedBusinessCatId, isRTL]);

  useEffect(() => {
    fetchBusinessCategories();
  }, [fetchBusinessCategories]);

  useEffect(() => {
    fetchSubCategories();
    fetchProducts();
  }, [fetchSubCategories, fetchProducts]);

  // When modal opens, set initial business category (if any) and fetch its sub‑categories
  useEffect(() => {
    if (isAddOpen && formData.businessCategoryId) {
      fetchModalSubCategories(formData.businessCategoryId);
    }
  }, [formData.businessCategoryId, isAddOpen, fetchModalSubCategories]);

  useEffect(() => {
    if (isEditOpen && formData.businessCategoryId) {
      fetchModalSubCategories(formData.businessCategoryId);
    }
  }, [formData.businessCategoryId, isEditOpen, fetchModalSubCategories]);

  // Barcode uniqueness check
  const checkBarcodeUniqueness = useCallback(async (barcode: string, excludeId?: string) => {
    if (!barcode) {
      setBarcodeValid(false);
      return false;
    }
    setBarcodeChecking(true);
    try {
      let url = `/api/admin/catalog-products/check-barcode?barcode=${encodeURIComponent(barcode)}`;
      if (excludeId) url += `&excludeId=${excludeId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.exists) {
        setBarcodeValid(false);
        toast.error(isRTL ? 'الباركود موجود بالفعل' : 'Barcode already exists');
        return false;
      }
      setBarcodeValid(true);
      return true;
    } catch (error) {
      setBarcodeValid(false);
      return false;
    } finally {
      setBarcodeChecking(false);
    }
  }, [isRTL]);

  const handleGenerateBarcode = async (excludeId?: string) => {
    let newBarcode = generateRandomBarcode();
    let attempts = 0;
    let exists = true;
    while (exists && attempts < 5) {
      let url = `/api/admin/catalog-products/check-barcode?barcode=${newBarcode}`;
      if (excludeId) url += `&excludeId=${excludeId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.exists) exists = false;
      else newBarcode = generateRandomBarcode();
      attempts++;
    }
    if (exists) {
      toast.error(isRTL ? 'فشل إنشاء باركود فريد' : 'Failed to generate unique barcode');
      return;
    }
    setFormData(prev => ({ ...prev, barcode: newBarcode }));
    setBarcodeValid(true);
    toast.info(isRTL ? 'تم إنشاء باركود فريد' : 'Unique barcode generated');
  };

  // Image upload
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

  // Create new business category
  const handleCreateBusinessCategory = async () => {
    if (!newBizCatNameEn.trim()) {
      toast.error(isRTL ? 'الاسم (إنجليزي) مطلوب' : 'Name (English) is required');
      return;
    }
    setCreatingBizCat(true);
    try {
      const res = await fetch('/api/admin/business-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEn: newBizCatNameEn, nameAr: newBizCatNameAr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isRTL ? 'تم إنشاء الفئة التجارية' : 'Business category created');
      await fetchBusinessCategories();
      setSelectedBusinessCatId(data.id);
      setFormData(prev => ({ ...prev, businessCategoryId: data.id }));
      setIsNewBizCatOpen(false);
      setNewBizCatNameEn('');
      setNewBizCatNameAr('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreatingBizCat(false);
    }
  };

  // Create new sub‑category (root level)
  const handleCreateSubCategory = async () => {
    if (!newSubCatNameEn.trim()) {
      toast.error(isRTL ? 'الاسم (إنجليزي) مطلوب' : 'Name (English) is required');
      return;
    }
    if (!selectedBusinessCatId) {
      toast.error(isRTL ? 'الرجاء اختيار فئة تجارية أولاً' : 'Please select a business category first');
      return;
    }
    setCreatingSubCat(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: newSubCatNameEn, ar: newSubCatNameAr || '' },
          businessCategoryId: selectedBusinessCatId,
          parentId: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isRTL ? 'تم إنشاء الفئة الفرعية' : 'Sub‑category created');
      await fetchSubCategories();
      setFormData(prev => ({ ...prev, categoryId: data.id }));
      setIsNewSubCatOpen(false);
      setNewSubCatNameEn('');
      setNewSubCatNameAr('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreatingSubCat(false);
    }
  };

  // Product CRUD
  const resetForm = () => {
    setFormData({
      barcode: '',
      nameEn: '',
      nameAr: '',
      businessCategoryId: selectedBusinessCatId,
      categoryId: '',
      descriptionEn: '',
      descriptionAr: '',
      imageUrl: '',
    });
    setImagePreview('');
    setBarcodeValid(true);
  };

  const handleAdd = async () => {
    if (!formData.barcode || !formData.nameEn || !formData.businessCategoryId) {
      toast.error(isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    if (!barcodeValid) {
      toast.error(isRTL ? 'الباركود غير صالح أو مكرر' : 'Invalid or duplicate barcode');
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
          businessCategoryId: formData.businessCategoryId,
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
      businessCategoryId: product.businessCategoryId,
      categoryId: product.categoryId || '',
      descriptionEn: product.description?.en || '',
      descriptionAr: product.description?.ar || '',
      imageUrl: product.images?.[0] || '',
    });
    setImagePreview(product.images?.[0] || '');
    setBarcodeValid(true);
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    if (!formData.nameEn || !formData.businessCategoryId) {
      toast.error(isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/catalog-products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: formData.nameEn, ar: formData.nameAr || '' },
          description: { en: formData.descriptionEn, ar: formData.descriptionAr || '' },
          businessCategoryId: formData.businessCategoryId,
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

  // Build sub‑category dropdown options for the modal (using modalSubCategories)
  const getModalSubCategoryOptions = () => {
    const options: { id: string; name: string }[] = [];
    const build = (cats: SubCategory[], level = 0) => {
      for (const cat of cats) {
        options.push({
          id: cat.id,
          name: '—'.repeat(level) + (cat.name?.en || cat.name?.ar),
        });
        if (cat.children && cat.children.length) build(cat.children, level + 1);
      }
    };
    build(modalSubCategories.filter(c => !c.parentId));
    return options;
  };

  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const headerClass = `font-semibold ${textAlignClass}`;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header + Add Product Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{isRTL ? 'مدير الكتالوج' : 'Catalog Manager'}</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
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
              {/* Barcode section */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="p-2">{isRTL ? 'الباركود *' : 'Barcode *'}</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, barcode: val });
                      checkBarcodeUniqueness(val);
                    }}
                    className={!barcodeValid ? 'border-red-500' : ''}
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => handleGenerateBarcode()}>
                  <QrCode className="h-4 w-4 mr-1" />
                  {isRTL ? 'توليد' : 'Generate'}
                </Button>
              </div>
              {!barcodeValid && (
                <p className="text-red-500 text-xs">{isRTL ? 'الباركود مكرر أو غير صالح' : 'Barcode already exists or invalid'}</p>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="p-2">{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
                  <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
                </div>
                <div>
                  <Label className="p-2">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
                </div>
              </div>

              {/* Business Category selector with Add New */}
              <div>
                <div className="flex justify-between items-center">
                  <Label className="p-2">{isRTL ? 'الفئة التجارية *' : 'Business Category *'}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewBizCatOpen(true)}
                    className="text-primary"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    {isRTL ? 'إضافة فئة جديدة' : 'Add New'}
                  </Button>
                </div>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={formData.businessCategoryId}
                  onChange={async (e) => {
                    const newBizId = e.target.value;
                    setFormData({ ...formData, businessCategoryId: newBizId, categoryId: '' });
                    await fetchModalSubCategories(newBizId);
                  }}
                >
                  <option value="">{isRTL ? 'اختر فئة تجارية' : 'Select a business category'}</option>
                  {businessCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name?.en}</option>
                  ))}
                </select>
              </div>

              {/* Sub‑category selector with Add New */}
              {formData.businessCategoryId && (
                <div>
                  <div className="flex justify-between items-center">
                    <Label className="p-2">{isRTL ? 'الفئة الفرعية (اختياري)' : 'Sub‑Category (optional)'}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewSubCatOpen(true)}
                      className="text-primary"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      {isRTL ? 'إضافة فئة فرعية' : 'Add New Sub'}
                    </Button>
                  </div>
                  <select
                    className="w-full border rounded-md p-2 mt-1"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">{isRTL ? 'لا شيء' : 'None'}</option>
                    {getModalSubCategoryOptions().map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="p-2">{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="p-2">{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                  <textarea
                    dir="rtl"
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <Label className="p-2">{isRTL ? 'صورة المنتج' : 'Product Image'}</Label>
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

              <Button onClick={handleAdd} disabled={loading || barcodeChecking || !barcodeValid} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRTL ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        {/* Search input */}
        <div>
          <Label className="block mb-1">{isRTL ? 'بحث' : 'Search'}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'بحث بالباركود أو الاسم' : 'Search by barcode or name'}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {/* Business Category selector with Add New */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label>{isRTL ? 'الفئة التجارية' : 'Business Category'}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewBizCatOpen(true)}
              className="text-primary h-auto py-1"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              {isRTL ? 'إضافة فئة جديدة' : 'Add New'}
            </Button>
          </div>
          <select
            className="w-full border rounded-md p-2"
            value={selectedBusinessCatId}
            onChange={(e) => setSelectedBusinessCatId(e.target.value)}
          >
            <option value="">{isRTL ? 'الكل' : 'All'}</option>
            {businessCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name?.en}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={headerClass}>{isRTL ? 'الباركود' : 'Barcode'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
              <TableHead className={headerClass}>{isRTL ? 'الفئة التجارية' : 'Business Category'}</TableHead>
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
              products.map(p => {
                const bizCat = businessCategories.find(bc => bc.id === p.businessCategoryId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className={`font-mono text-xs ${textAlignClass}`}>{p.barcode}</TableCell>
                    <TableCell className={textAlignClass}>{p.name?.en || '-'}</TableCell>
                    <TableCell className="text-right" dir="rtl">{p.name?.ar || '-'}</TableCell>
                    <TableCell className={textAlignClass}>{bizCat?.name?.en || '-'}</TableCell>
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
                );
              })
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
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="p-2">{isRTL ? 'الباركود' : 'Barcode'}</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, barcode: val });
                    checkBarcodeUniqueness(val, selectedProduct?.id);
                  }}
                  className={!barcodeValid ? 'border-red-500' : ''}
                />
              </div>
              <Button type="button" variant="outline" onClick={() => handleGenerateBarcode(selectedProduct?.id)}>
                <QrCode className="h-4 w-4 mr-1" />
                {isRTL ? 'توليد' : 'Generate'}
              </Button>
            </div>
            {!barcodeValid && (
              <p className="text-red-500 text-xs">{isRTL ? 'الباركود مكرر أو غير صالح' : 'Barcode already exists or invalid'}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="p-2">{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
                <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
              </div>
              <div>
                <Label className="p-2">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
              </div>
            </div>

            {/* Business Category selector in edit */}
            <div>
              <Label className="p-2">{isRTL ? 'الفئة التجارية' : 'Business Category'}</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.businessCategoryId}
                onChange={async (e) => {
                  const newBizId = e.target.value;
                  setFormData({ ...formData, businessCategoryId: newBizId, categoryId: '' });
                  await fetchModalSubCategories(newBizId);
                }}
              >
                {businessCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name?.en}</option>
                ))}
              </select>
            </div>

            {/* Sub‑category selector in edit */}
            {formData.businessCategoryId && (
              <div>
                <div className="flex justify-between items-center">
                  <Label className="p-2">{isRTL ? 'الفئة الفرعية (اختياري)' : 'Sub‑Category (optional)'}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewSubCatOpen(true)}
                    className="text-primary"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    {isRTL ? 'إضافة فئة فرعية' : 'Add New Sub'}
                  </Button>
                </div>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">{isRTL ? 'لا شيء' : 'None'}</option>
                  {getModalSubCategoryOptions().map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="p-2">{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                />
              </div>
              <div>
                <Label className="p-2">{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <textarea
                  dir="rtl"
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                />
              </div>
            </div>

            {/* Image upload (edit) */}
            <div>
              <Label className="p-2">{isRTL ? 'صورة المنتج' : 'Product Image'}</Label>
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

            <Button onClick={handleEdit} disabled={loading || barcodeChecking || !barcodeValid} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'تحديث' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Business Category Dialog */}
      <Dialog open={isNewBizCatOpen} onOpenChange={setIsNewBizCatOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة فئة تجارية جديدة' : 'Add New Business Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
              <Input value={newBizCatNameEn} onChange={(e) => setNewBizCatNameEn(e.target.value)} />
            </div>
            <div>
              <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
              <Input dir="rtl" value={newBizCatNameAr} onChange={(e) => setNewBizCatNameAr(e.target.value)} />
            </div>
            <Button onClick={handleCreateBusinessCategory} disabled={creatingBizCat} className="w-full">
              {creatingBizCat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'إنشاء' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Sub‑Category Dialog */}
      <Dialog open={isNewSubCatOpen} onOpenChange={setIsNewSubCatOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة فئة فرعية جديدة' : 'Add New Sub‑Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
              <Input value={newSubCatNameEn} onChange={(e) => setNewSubCatNameEn(e.target.value)} />
            </div>
            <div>
              <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
              <Input dir="rtl" value={newSubCatNameAr} onChange={(e) => setNewSubCatNameAr(e.target.value)} />
            </div>
            <div className="text-sm text-muted-foreground">
              {isRTL
                ? `سيتم إنشاء الفئة تحت الفئة التجارية: ${businessCategories.find(b => b.id === selectedBusinessCatId)?.name?.en || ''}`
                : `Will be created under business category: ${businessCategories.find(b => b.id === selectedBusinessCatId)?.name?.en || ''}`}
            </div>
            <Button onClick={handleCreateSubCategory} disabled={creatingSubCat} className="w-full">
              {creatingSubCat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'إنشاء' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
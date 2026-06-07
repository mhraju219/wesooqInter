'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, ScanBarcode, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: any;                // JSON object { en, ar }
  barcode: string;
  sku: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  availableOnline: boolean;
  isActive: boolean;
}

interface CatalogProduct {
  id: string;
  barcode: string;
  name: string;
  category: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  businessId: string;
}

export function ProductsClient({ initialProducts, businessId }: ProductsClientProps) {
  const { locale } = useLanguage();               // 'en' or 'ar'
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  // Add product state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    barcode: '',
    sku: '',
    sellingPrice: '',
    costPrice: '',
    stockQuantity: '',
    availableOnline: true,
  });

  // Barcode scanner and catalog creation state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedCatalog, setScannedCatalog] = useState<CatalogProduct | null>(null);
  const [isCreateCatalogOpen, setIsCreateCatalogOpen] = useState(false);
  const [newCatalogData, setNewCatalogData] = useState({
    barcode: '',
    nameEn: '',
    nameAr: '',
    category: 'SUPERMARKET',
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [nextSku, setNextSku] = useState('');

  // Fetch next available SKU
  const fetchNextSku = async () => {
    try {
      const res = await fetch('/api/products/next-sku');
      const data = await res.json();
      if (res.ok) {
        setNextSku(data.nextSku);
        setFormData(prev => ({ ...prev, sku: data.nextSku }));
      }
    } catch (error) {
      console.error('Failed to fetch next SKU');
    }
  };

  const resetAddForm = () => {
    setFormData({
      barcode: '',
      sku: '',
      sellingPrice: '',
      costPrice: '',
      stockQuantity: '',
      availableOnline: true,
    });
    setScannedCatalog(null);
    setBarcodeInput('');
    setNextSku('');
  };

  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) {
      toast.error(locale === 'ar' ? 'يرجى إدخال الباركود' : 'Please enter a barcode');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/lookup?barcode=${barcodeInput}`);
      const data = await res.json();
      if (data.exists) {
        if (data.categoryMismatch) {
          toast.error(data.message || 'Category mismatch');
          setScannedCatalog(null);
        } else if (data.inventory) {
          toast.error(locale === 'ar' ? 'هذا المنتج موجود بالفعل في المخزون' : 'Product already in inventory');
          setScannedCatalog(null);
        } else {
          setScannedCatalog({
            id: data.catalog.id,
            barcode: data.catalog.barcode,
            name: data.catalog.name.en,
            category: data.catalog.category,
          });
          toast.success(locale === 'ar' ? 'المنتج موجود في الكتالوج' : 'Product found in catalog');
          await fetchNextSku();
          setIsAddOpen(true);
        }
      } else {
        setIsCreateCatalogOpen(true);
        setNewCatalogData(prev => ({ ...prev, barcode: barcodeInput }));
      }
    } catch (error) {
      console.error(error);
      toast.error(locale === 'ar' ? 'خطأ في البحث' : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogImageUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewCatalogData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCatalog = async () => {
    if (!newCatalogData.nameEn || !newCatalogData.category) {
      toast.error(locale === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/catalog-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: newCatalogData.barcode,
          name: { en: newCatalogData.nameEn, ar: newCatalogData.nameAr || '' },
          category: newCatalogData.category,
          images: newCatalogData.imageUrl ? [newCatalogData.imageUrl] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(locale === 'ar' ? 'تم إضافة المنتج إلى الكتالوج' : 'Catalog product created');
      setIsCreateCatalogOpen(false);
      setBarcodeInput(newCatalogData.barcode);
      await handleBarcodeLookup();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async () => {
    if (!scannedCatalog) return;
    if (!formData.sellingPrice) {
      toast.error(locale === 'ar' ? 'يرجى إدخال سعر البيع' : 'Please enter selling price');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          catalogProductId: scannedCatalog.id,
          sellingPrice: parseFloat(formData.sellingPrice),
          costPrice: parseFloat(formData.costPrice || '0'),
          stockQuantity: parseInt(formData.stockQuantity || '0'),
          availableOnline: formData.availableOnline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(locale === 'ar' ? 'تم إضافة المنتج إلى المخزون' : 'Product added to inventory');
      setIsAddOpen(false);
      resetAddForm();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellingPrice: parseFloat(formData.sellingPrice),
          costPrice: parseFloat(formData.costPrice),
          stockQuantity: parseInt(formData.stockQuantity),
          availableOnline: formData.availableOnline,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(locale === 'ar' ? 'تم التحديث' : 'Product updated');
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(locale === 'ar' ? 'تم الحذف' : 'Product deleted');
      router.refresh();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      barcode: product.barcode,
      sku: product.sku,
      sellingPrice: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stockQuantity: product.stockQuantity.toString(),
      availableOnline: product.availableOnline,
    });
    setIsEditOpen(true);
  };

  // Helper: get product name in current locale
  const getProductName = (product: Product) => {
    if (typeof product.name === 'string') return product.name;
    return product.name?.[locale] || product.name?.en || 'Product';
  };

  return (
    <div className="space-y-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Add Product Button */}
      <div className="flex justify-between gap-2">
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetAddForm(); setIsAddOpen(open); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>{locale === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={locale === 'ar' ? 'مسح الباركود أو إدخاله' : 'Scan or enter barcode'}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeLookup()}
                />
                <Button type="button" variant="outline" onClick={handleBarcodeLookup} disabled={loading}>
                  <ScanBarcode className="h-4 w-4 mr-1" />
                  {locale === 'ar' ? 'بحث' : 'Lookup'}
                </Button>
              </div>

              {scannedCatalog && (
                <div className="bg-muted p-3 rounded-md">
                  <p><strong>{locale === 'ar' ? 'المنتج' : 'Product'}:</strong> {scannedCatalog.name}</p>
                  <p><strong>{locale === 'ar' ? 'الباركود' : 'Barcode'}:</strong> {scannedCatalog.barcode}</p>
                  <p><strong>{locale === 'ar' ? 'الفئة' : 'Category'}:</strong> {scannedCatalog.category}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{locale === 'ar' ? 'سعر البيع' : 'Selling Price'} *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{locale === 'ar' ? 'سعر التكلفة' : 'Cost Price'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{locale === 'ar' ? 'المخزون' : 'Stock'}</Label>
                  <Input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input
                    value={nextSku || formData.sku}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availableOnline"
                  checked={formData.availableOnline}
                  onChange={(e) => setFormData({ ...formData, availableOnline: e.target.checked })}
                />
                <Label htmlFor="availableOnline">{locale === 'ar' ? 'متاح للشراء عبر الإنترنت' : 'Available for online purchase'}</Label>
              </div>
              <Button onClick={handleAddInventory} disabled={loading || !scannedCatalog} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {locale === 'ar' ? 'إضافة إلى المخزون' : 'Add to Inventory'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-muted-foreground self-center">
          {locale === 'ar' ? 'SKU يتم إنشاؤه تلقائياً' : 'SKU is auto‑generated'}
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'الاسم' : 'Name'}</TableHead>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'الباركود' : 'Barcode'}</TableHead>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'SKU' : 'SKU'}</TableHead>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'سعر البيع' : 'Price'}</TableHead>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'المخزون' : 'Stock'}</TableHead>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'أونلاين' : 'Online'}</TableHead>
              <TableHead className={locale === 'ar' ? 'text-right' : 'text-left'}>{locale === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {locale === 'ar' ? 'لا توجد منتجات' : 'No products found'}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{getProductName(product)}</TableCell>
                  <TableCell className="font-mono text-xs">{product.barcode}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stockQuantity}</TableCell>
                  <TableCell>
                    <Badge variant={product.availableOnline ? 'default' : 'secondary'}>
                      {product.availableOnline ? (locale === 'ar' ? 'نعم' : 'Yes') : (locale === 'ar' ? 'لا' : 'No')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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
        <DialogContent className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{locale === 'ar' ? 'سعر البيع' : 'Selling Price'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'سعر التكلفة' : 'Cost Price'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'المخزون' : 'Stock'}</Label>
              <Input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editAvailableOnline"
                checked={formData.availableOnline}
                onChange={(e) => setFormData({ ...formData, availableOnline: e.target.checked })}
              />
              <Label htmlFor="editAvailableOnline">{locale === 'ar' ? 'متاح للشراء عبر الإنترنت' : 'Available online'}</Label>
            </div>
            <Button onClick={handleEdit} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {locale === 'ar' ? 'تحديث' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Catalog Product Dialog */}
      <Dialog open={isCreateCatalogOpen} onOpenChange={setIsCreateCatalogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'منتج جديد في الكتالوج' : 'New Catalog Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Barcode</Label>
              <Input value={newCatalogData.barcode} disabled />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *</Label>
              <Input
                value={newCatalogData.nameEn}
                onChange={(e) => setNewCatalogData({ ...newCatalogData, nameEn: e.target.value })}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
              <Input
                dir="rtl"
                value={newCatalogData.nameAr}
                onChange={(e) => setNewCatalogData({ ...newCatalogData, nameAr: e.target.value })}
              />
            </div>
            <div>
              <Label>{locale === 'ar' ? 'الفئة' : 'Category'}</Label>
              <select
                className="w-full border rounded-md p-2"
                value={newCatalogData.category}
                onChange={(e) => setNewCatalogData({ ...newCatalogData, category: e.target.value })}
              >
                <option value="SUPERMARKET">Supermarket</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="HOSPITAL">Hospital (for services)</option>
              </select>
            </div>

            <div>
              <Label>{locale === 'ar' ? 'صورة المنتج' : 'Product Image'}</Label>
              <div className="flex items-center gap-4 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('catalogImageUpload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : (locale === 'ar' ? 'رفع صورة' : 'Upload Image')}
                </Button>
                <input
                  id="catalogImageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleCatalogImageUpload(file);
                  }}
                />
                {newCatalogData.imageUrl && (
                  <div className="relative">
                    <img src={newCatalogData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      onClick={() => setNewCatalogData({ ...newCatalogData, imageUrl: '' })}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === 'ar' ? 'صورة واحدة فقط. الحجم الموصى به: 500×500 بكسل' : 'Only one image. Recommended size: 500x500px.'}
              </p>
            </div>

            <Button onClick={handleCreateCatalog} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'إنشاء وإضافة إلى المخزون' : 'Create & Add to Inventory'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
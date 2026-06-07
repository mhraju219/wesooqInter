'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CatalogProduct {
  id: string;
  barcode: string;
  name: any;
  description?: any;
  category: string;
  images: string[];
  isActive: boolean;
}

interface CatalogManagerProps {
  initialProducts: CatalogProduct[];
}

export function CatalogManager({ initialProducts }: CatalogManagerProps) {
  const { locale } = useLanguage();
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    barcode: '',
    nameEn: '',
    nameAr: '',
    category: 'SUPERMARKET',
    descriptionEn: '',
    descriptionAr: '',
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);

  const categories = ['HOSPITAL', 'SUPERMARKET', 'RESTAURANT', 'ELECTRONICS'];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      const res = await fetch(`/api/admin/catalog-products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.items);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success(locale === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
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
      descriptionEn: '',
      descriptionAr: '',
      imageUrl: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.barcode || !formData.nameEn) {
      toast.error(locale === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
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
          images: formData.imageUrl ? [formData.imageUrl] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(locale === 'ar' ? 'تمت الإضافة' : 'Product added');
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
      descriptionEn: product.description?.en || '',
      descriptionAr: product.description?.ar || '',
      imageUrl: product.images?.[0] || '',
    });
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
          images: formData.imageUrl ? [formData.imageUrl] : [],
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(locale === 'ar' ? 'تم التحديث' : 'Product updated');
      setIsEditOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/catalog-products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(locale === 'ar' ? 'تم الحذف' : 'Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Catalog Manager</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Add New Catalog Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Barcode *</Label>
                <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name (English) *</Label>
                  <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
                </div>
                <div>
                  <Label>Name (Arabic)</Label>
                  <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Description (English)</Label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description (Arabic)</Label>
                  <textarea
                    dir="rtl"
                    className="w-full border rounded-md p-2"
                    rows={2}
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Product Image (single)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
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
                  {formData.imageUrl && (
                    <div className="relative">
                      <img src={formData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Only one image. Recommended size: 500x500px.</p>
              </div>

              <Button onClick={handleAdd} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by barcode or name"
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
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No products found</TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                  <TableCell>{p.name?.en || '-'}</TableCell>
                  <TableCell dir="rtl">{p.name?.ar || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                  <TableCell>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name?.en} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Catalog Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name (English) *</Label>
                <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description (English)</Label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                />
              </div>
              <div>
                <Label>Description (Arabic)</Label>
                <textarea
                  dir="rtl"
                  className="w-full border rounded-md p-2"
                  rows={2}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                />
              </div>
            </div>

            {/* Image Upload (edit) */}
            <div>
              <Label>Product Image (single)</Label>
              <div className="flex items-center gap-4 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('editImageUpload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Change Image'}
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
                {formData.imageUrl && (
                  <div className="relative">
                    <img src={formData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Only one image. Recommended size: 500x500px.</p>
            </div>

            <Button onClick={handleEdit} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
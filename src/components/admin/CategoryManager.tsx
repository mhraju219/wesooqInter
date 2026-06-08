'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessCategory {
  id: string;
  name: any;
  slug: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: any;
  slug: string;
  businessCategoryId: string;
  parentId: string | null;
  children: Category[];
  isActive: boolean;
}

export function CategoryManager() {
  const { locale } = useLanguage();
  const isRTL = locale === 'ar';

  // Business Categories state
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [selectedBusinessCatId, setSelectedBusinessCatId] = useState('');

  // Sub‑categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [search, setSearch] = useState('');

  // Business Category CRUD
  const [isAddBizOpen, setIsAddBizOpen] = useState(false);
  const [isEditBizOpen, setIsEditBizOpen] = useState(false);
  const [selectedBizCat, setSelectedBizCat] = useState<BusinessCategory | null>(null);
  const [bizFormData, setBizFormData] = useState({ nameEn: '', nameAr: '' });
  const [creatingBiz, setCreatingBiz] = useState(false);

  // Sub‑category CRUD
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [isEditSubOpen, setIsEditSubOpen] = useState(false);
  const [selectedSubCat, setSelectedSubCat] = useState<Category | null>(null);
  const [subFormData, setSubFormData] = useState({
    nameEn: '',
    nameAr: '',
    businessCategoryId: '',
    parentId: '',
  });
  const [loadingSubCrud, setLoadingSubCrud] = useState(false);

  // ---------- Business Category API ----------
  const fetchBusinessCategories = useCallback(async () => {
    setLoadingBiz(true);
    try {
      const res = await fetch('/api/admin/business-categories');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBusinessCategories(data);
      if (data.length > 0 && !selectedBusinessCatId) {
        setSelectedBusinessCatId(data[0].id);
      }
    } catch (error) {
      toast.error(isRTL ? 'فشل تحميل الفئات التجارية' : 'Failed to load business categories');
    } finally {
      setLoadingBiz(false);
    }
  }, [isRTL, selectedBusinessCatId]);

  const handleCreateBusinessCategory = async () => {
    if (!bizFormData.nameEn.trim()) {
      toast.error(isRTL ? 'الاسم (إنجليزي) مطلوب' : 'Name (English) is required');
      return;
    }
    setCreatingBiz(true);
    try {
      const res = await fetch('/api/admin/business-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEn: bizFormData.nameEn, nameAr: bizFormData.nameAr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isRTL ? 'تم إنشاء الفئة التجارية' : 'Business category created');
      await fetchBusinessCategories();
      setIsAddBizOpen(false);
      setBizFormData({ nameEn: '', nameAr: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreatingBiz(false);
    }
  };

  const handleUpdateBusinessCategory = async () => {
    if (!selectedBizCat) return;
    if (!bizFormData.nameEn.trim()) {
      toast.error(isRTL ? 'الاسم (إنجليزي) مطلوب' : 'Name (English) is required');
      return;
    }
    setCreatingBiz(true);
    try {
      const res = await fetch(`/api/admin/business-categories/${selectedBizCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: bizFormData.nameEn, ar: bizFormData.nameAr || '' },
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(isRTL ? 'تم التحديث' : 'Business category updated');
      setIsEditBizOpen(false);
      setBizFormData({ nameEn: '', nameAr: '' });
      fetchBusinessCategories();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setCreatingBiz(false);
    }
  };

  const handleDeleteBusinessCategory = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من الحذف؟ سيتم حذف جميع الفئات الفرعية المرتبطة أيضًا.' : 'Are you sure? All associated sub‑categories will also be deleted.')) return;
    try {
      const res = await fetch(`/api/admin/business-categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(isRTL ? 'تم الحذف' : 'Business category deleted');
      fetchBusinessCategories();
      if (selectedBusinessCatId === id) {
        const remaining = businessCategories.filter(c => c.id !== id);
        setSelectedBusinessCatId(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // ---------- Sub‑category API ----------
  const fetchSubCategories = useCallback(async () => {
    if (!selectedBusinessCatId) {
      setCategories([]);
      return;
    }
    setLoadingSub(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('businessCategoryId', selectedBusinessCatId);
      const res = await fetch(`/api/admin/categories?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error(isRTL ? 'فشل تحميل الفئات الفرعية' : 'Failed to load sub‑categories');
    } finally {
      setLoadingSub(false);
    }
  }, [search, selectedBusinessCatId, isRTL]);

  useEffect(() => {
    fetchBusinessCategories();
  }, [fetchBusinessCategories]);

  useEffect(() => {
    fetchSubCategories();
  }, [fetchSubCategories]);

  // Sub‑category CRUD handlers
  const resetSubForm = () => {
    setSubFormData({
      nameEn: '',
      nameAr: '',
      businessCategoryId: selectedBusinessCatId,
      parentId: '',
    });
  };

  const handleAddSubCategory = async () => {
    if (!subFormData.nameEn) {
      toast.error(isRTL ? 'الاسم (إنجليزي) مطلوب' : 'Name (English) is required');
      return;
    }
    if (!subFormData.businessCategoryId) {
      toast.error(isRTL ? 'الرجاء اختيار فئة تجارية' : 'Please select a business category');
      return;
    }
    setLoadingSubCrud(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: subFormData.nameEn, ar: subFormData.nameAr || '' },
          businessCategoryId: subFormData.businessCategoryId,
          parentId: subFormData.parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isRTL ? 'تمت الإضافة' : 'Sub‑category added');
      setIsAddSubOpen(false);
      resetSubForm();
      fetchSubCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingSubCrud(false);
    }
  };

  const openEditSub = (cat: Category) => {
    setSelectedSubCat(cat);
    setSubFormData({
      nameEn: cat.name?.en || '',
      nameAr: cat.name?.ar || '',
      businessCategoryId: cat.businessCategoryId,
      parentId: cat.parentId || '',
    });
    setIsEditSubOpen(true);
  };

  const handleEditSubCategory = async () => {
    if (!selectedSubCat) return;
    if (!subFormData.nameEn) {
      toast.error(isRTL ? 'الاسم (إنجليزي) مطلوب' : 'Name (English) is required');
      return;
    }
    setLoadingSubCrud(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedSubCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: subFormData.nameEn, ar: subFormData.nameAr || '' },
          parentId: subFormData.parentId || null,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(isRTL ? 'تم التحديث' : 'Sub‑category updated');
      setIsEditSubOpen(false);
      resetSubForm();
      fetchSubCategories();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoadingSubCrud(false);
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(isRTL ? 'تم الحذف' : 'Sub‑category deleted');
      fetchSubCategories();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // Build parent dropdown options (tree)
  const getParentOptions = (cats: Category[], parentId: string | null = null, level = 0, excludeId?: string) => {
    let options: { id: string; name: string; level: number }[] = [];
    const filtered = cats.filter(c => c.parentId === parentId && c.id !== excludeId);
    for (const cat of filtered) {
      options.push({ id: cat.id, name: '—'.repeat(level) + (cat.name?.en || cat.name?.ar), level });
      options.push(...getParentOptions(cats, cat.id, level + 1, excludeId));
    }
    return options;
  };
  const parentOptions = getParentOptions(categories, null, 0, selectedSubCat?.id);

  // UI helpers
  const textAlignClass = isRTL ? 'text-right' : 'text-left';
  const headerClass = `font-semibold ${textAlignClass}`;

  return (
    <div className="space-y-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ========== SECTION 1: BUSINESS CATEGORIES ========== */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{isRTL ? 'الفئات التجارية' : 'Business Categories'}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? 'إدارة الفئات الرئيسية للمتاجر (مثل سوبر ماركت، مطعم، إلخ)' : 'Manage top‑level store categories (e.g., Supermarket, Restaurant, etc.)'}
              </p>
            </div>
            <Dialog open={isAddBizOpen} onOpenChange={setIsAddBizOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {isRTL ? 'إضافة فئة تجارية' : 'Add Business Category'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                <DialogHeader>
                  <DialogTitle>{isRTL ? 'إضافة فئة تجارية جديدة' : 'Add New Business Category'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="mb-1 block">{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
                    <Input value={bizFormData.nameEn} onChange={(e) => setBizFormData({ ...bizFormData, nameEn: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1 block">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                    <Input dir="rtl" value={bizFormData.nameAr} onChange={(e) => setBizFormData({ ...bizFormData, nameAr: e.target.value })} />
                  </div>
                  <Button onClick={handleCreateBusinessCategory} disabled={creatingBiz} className="w-full">
                    {creatingBiz && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isRTL ? 'حفظ' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headerClass}>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBiz ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></TableCell></TableRow>
              ) : businessCategories.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{isRTL ? 'لا توجد فئات تجارية' : 'No business categories'}</TableCell></TableRow>
              ) : (
                businessCategories.map(bc => (
                  <TableRow key={bc.id}>
                    <TableCell className={textAlignClass}>{bc.name?.en}</TableCell>
                    <TableCell dir="rtl">{bc.name?.ar || '-'}</TableCell>
                    <TableCell className={textAlignClass}>
                      <Badge variant={bc.isActive ? 'default' : 'secondary'}>
                        {bc.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className={textAlignClass}>
                      <div className="flex gap-2 justify-start rtl:justify-end">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedBizCat(bc);
                          setBizFormData({ nameEn: bc.name?.en || '', nameAr: bc.name?.ar || '' });
                          setIsEditBizOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBusinessCategory(bc.id)}>
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
      </div>

      {/* Section Divider */}
      <hr className="border-t-2 border-gray-200 dark:border-gray-700 my-4" />

      {/* ========== SECTION 2: PRODUCT SUB‑CATEGORIES ========== */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{isRTL ? 'الفئات الفرعية (تصنيفات المنتجات)' : 'Product Sub‑Categories'}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? 'إدارة الفئات الفرعية للمنتجات (ترتبط بفئة تجارية محددة)' : 'Manage product sub‑categories (linked to a business category)'}
              </p>
            </div>
            <Button onClick={() => {
              resetSubForm();
              setIsAddSubOpen(true);
            }} disabled={!selectedBusinessCatId}>
              <Plus className="mr-2 h-4 w-4" />
              {isRTL ? 'إضافة فئة فرعية' : 'Add Sub‑Category'}
            </Button>
          </div>
        </div>

        {/* Filters for sub‑categories */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block mb-2">{isRTL ? 'الفئة التجارية' : 'Business Category'}</Label>
              <select
                className="w-full border rounded-md p-2 bg-background"
                value={selectedBusinessCatId}
                onChange={(e) => setSelectedBusinessCatId(e.target.value)}
              >
                <option value="">{isRTL ? 'اختر فئة تجارية' : 'Select a business category'}</option>
                {businessCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name?.en}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="block mb-2">{isRTL ? 'بحث' : 'Search'}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? 'بحث بالاسم' : 'Search by name'}
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={!selectedBusinessCatId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sub‑categories table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={headerClass}>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'المستوى' : 'Level'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className={headerClass}>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedBusinessCatId ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{isRTL ? 'يرجى اختيار فئة تجارية أولاً' : 'Please select a business category first'}</TableCell></TableRow>
              ) : loadingSub ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{isRTL ? 'لا توجد فئات فرعية' : 'No sub‑categories'}</TableCell></TableRow>
              ) : (
                categories.map(cat => {
                  const level = cat.parentId ? 1 : 0; // simplified level for demo
                  return (
                    <TableRow key={cat.id}>
                      <TableCell className={textAlignClass}>{'—'.repeat(level)} {cat.name?.en}</TableCell>
                      <TableCell dir="rtl">{cat.name?.ar || '-'}</TableCell>
                      <TableCell className={textAlignClass}>{level}</TableCell>
                      <TableCell className={textAlignClass}>
                        <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                          {cat.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className={textAlignClass}>
                        <div className="flex gap-2 justify-start rtl:justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditSub(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSubCategory(cat.id)}>
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
      </div>

      {/* ========== DIALOGS ========== */}

      {/* Edit Business Category Dialog */}
      <Dialog open={isEditBizOpen} onOpenChange={setIsEditBizOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل الفئة التجارية' : 'Edit Business Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="mb-1 block">{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
              <Input value={bizFormData.nameEn} onChange={(e) => setBizFormData({ ...bizFormData, nameEn: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
              <Input dir="rtl" value={bizFormData.nameAr} onChange={(e) => setBizFormData({ ...bizFormData, nameAr: e.target.value })} />
            </div>
            <Button onClick={handleUpdateBusinessCategory} disabled={creatingBiz} className="w-full">
              {creatingBiz && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'تحديث' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Sub‑Category Dialog (with Business Category dropdown) */}
      <Dialog open={isAddSubOpen} onOpenChange={(open) => { if (!open) resetSubForm(); setIsAddSubOpen(open); }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة فئة فرعية جديدة' : 'Add New Sub‑Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="mb-1 block">{isRTL ? 'الفئة التجارية *' : 'Business Category *'}</Label>
              <select
                className="w-full border rounded-md p-2 bg-background"
                value={subFormData.businessCategoryId}
                onChange={(e) => setSubFormData({ ...subFormData, businessCategoryId: e.target.value, parentId: '' })}
              >
                <option value="">{isRTL ? 'اختر فئة تجارية' : 'Select a business category'}</option>
                {businessCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name?.en}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block">{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
              <Input value={subFormData.nameEn} onChange={(e) => setSubFormData({ ...subFormData, nameEn: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
              <Input dir="rtl" value={subFormData.nameAr} onChange={(e) => setSubFormData({ ...subFormData, nameAr: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">{isRTL ? 'الفئة الأم (اختياري)' : 'Parent Category (optional)'}</Label>
              <select
                className="w-full border rounded-md p-2 bg-background"
                value={subFormData.parentId}
                onChange={(e) => setSubFormData({ ...subFormData, parentId: e.target.value })}
                disabled={!subFormData.businessCategoryId}
              >
                <option value="">{isRTL ? 'لا شيء (فئة جذر)' : 'None (Root)'}</option>
                {parentOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddSubCategory} disabled={loadingSubCrud} className="w-full">
              {loadingSubCrud && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sub‑Category Dialog */}
      <Dialog open={isEditSubOpen} onOpenChange={(open) => { if (!open) resetSubForm(); setIsEditSubOpen(open); }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل الفئة الفرعية' : 'Edit Sub‑Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="mb-1 block">{isRTL ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</Label>
              <Input value={subFormData.nameEn} onChange={(e) => setSubFormData({ ...subFormData, nameEn: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
              <Input dir="rtl" value={subFormData.nameAr} onChange={(e) => setSubFormData({ ...subFormData, nameAr: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block">{isRTL ? 'الفئة الأم (اختياري)' : 'Parent Category (optional)'}</Label>
              <select
                className="w-full border rounded-md p-2 bg-background"
                value={subFormData.parentId}
                onChange={(e) => setSubFormData({ ...subFormData, parentId: e.target.value })}
              >
                <option value="">{isRTL ? 'لا شيء (فئة جذر)' : 'None (Root)'}</option>
                {parentOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleEditSubCategory} disabled={loadingSubCrud} className="w-full">
              {loadingSubCrud && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRTL ? 'تحديث' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
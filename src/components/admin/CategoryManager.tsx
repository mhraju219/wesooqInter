'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: any;
  slug: string;
  businessCategory: string;
  parentId: string | null;
  children: Category[];
  isActive: boolean;
}

const businessCategories = [
  'HOSPITAL', 'SUPERMARKET', 'RESTAURANT', 'ELECTRONICS',
  'FLOWER_SHOP', 'MOBILE_ACCESSORIES', 'VEHICLES'
];

export function CategoryManager() {
  const { locale } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    businessCategory: 'SUPERMARKET',
    parentId: '',
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      businessCategory: 'SUPERMARKET',
      parentId: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.nameEn || !formData.businessCategory) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: formData.nameEn, ar: formData.nameAr || '' },
          businessCategory: formData.businessCategory,
          parentId: formData.parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Category added');
      setIsAddOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setFormData({
      nameEn: cat.name?.en || '',
      nameAr: cat.name?.ar || '',
      businessCategory: cat.businessCategory,
      parentId: cat.parentId || '',
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { en: formData.nameEn, ar: formData.nameAr || '' },
          parentId: formData.parentId || null,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Category updated');
      setIsEditOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // Flatten categories for table display
  const flattenCategories = (cats: Category[], level = 0): any[] => {
    let result: any[] = [];
    for (const cat of cats) {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatList = flattenCategories(categories.filter(c => !c.parentId));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Category Manager</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name (English) *</Label>
                <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
              </div>
              <div>
                <Label>Business Category *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                >
                  {businessCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Parent Category (optional)</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">None (Root)</option>
                  {flatList.filter(c => c.businessCategory === formData.businessCategory).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'—'.repeat(cat.level)} {cat.name?.en}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAdd} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Business Category</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No categories</TableCell>
              </TableRow>
            ) : (
              flatList.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>{'—'.repeat(cat.level)} {cat.name?.en}</TableCell>
                  <TableCell dir="rtl">{cat.name?.ar || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{cat.businessCategory}</Badge></TableCell>
                  <TableCell>{cat.level}</TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
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
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name (English)</Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} />
            </div>
            <div>
              <Label>Name (Arabic)</Label>
              <Input dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} />
            </div>
            <div>
              <Label>Parent Category</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              >
                <option value="">None (Root)</option>
                {flatList.filter(c => c.id !== selectedCategory?.id && c.businessCategory === formData.businessCategory).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'—'.repeat(cat.level)} {cat.name?.en}
                  </option>
                ))}
              </select>
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
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Store } from 'lucide-react';
import { toast } from 'sonner';

type AccountType = 'customer' | 'merchant';

export default function RegisterPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullNameEn: '',
    fullNameAr: '',
    phone: '',
  });

  // Merchant form state
  const [merchantForm, setMerchantForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullNameEn: '',
    fullNameAr: '',
    businessNameEn: '',
    businessNameAr: '',
    businessCategory: 'SUPERMARKET',
    contactPhone: '',
  });

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (customerForm.password !== customerForm.confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerForm.email,
          password: customerForm.password,
          fullName: { en: customerForm.fullNameEn, ar: customerForm.fullNameAr },
          phone: customerForm.phone,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text.substring(0, 100));
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      toast.success(locale === 'ar' ? 'تم التسجيل بنجاح! يمكنك تسجيل الدخول الآن.' : 'Registration successful! You can now log in.');
      router.push('/auth/login');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (merchantForm.password !== merchantForm.confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: merchantForm.email,
          password: merchantForm.password,
          fullName: { en: merchantForm.fullNameEn, ar: merchantForm.fullNameAr },
          businessName: { en: merchantForm.businessNameEn, ar: merchantForm.businessNameAr },
          businessCategory: merchantForm.businessCategory,
          contactPhone: merchantForm.contactPhone,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text.substring(0, 100));
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Merchant registration failed');

      toast.success(locale === 'ar' ? 'تم تسجيل المتجر! سيتم تفعيله بعد موافقة الإدارة.' : 'Merchant registration submitted! Please wait for admin approval.');
      router.push('/auth/login');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'HOSPITAL', labelEn: 'Hospital / Clinic', labelAr: 'مستشفى / عيادة' },
    { value: 'SUPERMARKET', labelEn: 'Supermarket', labelAr: 'سوبر ماركت' },
    { value: 'RESTAURANT', labelEn: 'Restaurant', labelAr: 'مطعم' },
    { value: 'ELECTRONICS', labelEn: 'Electronics Shop', labelAr: 'متجر إلكترونيات' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {locale === 'ar' ? 'تسجيل حساب جديد' : 'Create an account'}
          </CardTitle>
          <CardDescription className="text-center">
            {locale === 'ar' ? 'اختر نوع الحساب' : 'Choose account type'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Account type toggle */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setAccountType('customer')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                accountType === 'customer'
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block mr-2 h-5 w-5" />
              {locale === 'ar' ? 'عميل' : 'Customer'}
            </button>
            <button
              type="button"
              onClick={() => setAccountType('merchant')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                accountType === 'merchant'
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Store className="inline-block mr-2 h-5 w-5" />
              {locale === 'ar' ? 'تاجر' : 'Merchant'}
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Customer Registration Form */}
          {accountType === 'customer' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name (English)</Label>
                  <Input
                    value={customerForm.fullNameEn}
                    onChange={(e) => setCustomerForm({ ...customerForm, fullNameEn: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Full Name (Arabic)</Label>
                  <Input
                    dir="rtl"
                    value={customerForm.fullNameAr}
                    onChange={(e) => setCustomerForm({ ...customerForm, fullNameAr: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={customerForm.password}
                    onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={customerForm.confirmPassword}
                    onChange={(e) => setCustomerForm({ ...customerForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {locale === 'ar' ? 'تسجيل كعميل' : 'Register as Customer'}
              </Button>
            </form>
          )}

          {/* Merchant Registration Form */}
          {accountType === 'merchant' && (
            <form onSubmit={handleMerchantSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name (English)</Label>
                  <Input
                    value={merchantForm.fullNameEn}
                    onChange={(e) => setMerchantForm({ ...merchantForm, fullNameEn: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Full Name (Arabic)</Label>
                  <Input
                    dir="rtl"
                    value={merchantForm.fullNameAr}
                    onChange={(e) => setMerchantForm({ ...merchantForm, fullNameAr: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Name (English)</Label>
                  <Input
                    value={merchantForm.businessNameEn}
                    onChange={(e) => setMerchantForm({ ...merchantForm, businessNameEn: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Business Name (Arabic)</Label>
                  <Input
                    dir="rtl"
                    value={merchantForm.businessNameAr}
                    onChange={(e) => setMerchantForm({ ...merchantForm, businessNameAr: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Business Category</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={merchantForm.businessCategory}
                  onChange={(e) => setMerchantForm({ ...merchantForm, businessCategory: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {locale === 'ar' ? cat.labelAr : cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  value={merchantForm.contactPhone}
                  onChange={(e) => setMerchantForm({ ...merchantForm, contactPhone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={merchantForm.email}
                  onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={merchantForm.password}
                    onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={merchantForm.confirmPassword}
                    onChange={(e) => setMerchantForm({ ...merchantForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {locale === 'ar' ? 'تسجيل كتاجر' : 'Register as Merchant'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <div className="text-sm text-muted-foreground">
            {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
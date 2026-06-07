'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      const errorMsg = locale === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    // Fetch session to determine user role
    const session = await getSession();
    if (session?.user?.role === 'CUSTOMER') {
      toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      router.push('/customer/orders');
    } else {
      toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      router.push('/dashboard');
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </CardTitle>
          <CardDescription>
            {locale === 'ar'
              ? 'أدخل بيانات اعتمادك للوصول إلى لوحة التحكم'
              : 'Enter your credentials to access your dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {locale === 'ar' ? 'دخول' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {locale === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              {locale === 'ar' ? 'إنشاء حساب جديد' : 'Create account'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
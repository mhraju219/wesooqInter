"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/store/cartStore";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  Moon,
  Sun,
  Menu,
  User,
  LogOut,
  Settings,
  Package,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const { locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Hide header on dashboard routes
if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) return null;

  const navLinks = [
    { href: "/", label: locale === "ar" ? "الرئيسية" : "Home" },
    { href: "/marketplace", label: locale === "ar" ? "المتجر" : "Marketplace" },
    { href: "/about", label: locale === "ar" ? "من نحن" : "About" },
  ];

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          <span className="text-xl font-bold text-primary">WeSoooq</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:right-auto h-5 w-5 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Language Toggle Button with Flags (reliable, no dropdown issues) */}
          <Button
            variant="ghost"
            size="default"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="gap-2"
          >
            {locale === "en" ? (
              <>
                <span>🇸🇦</span>
                <span className="hidden sm:inline">العربية</span>
              </>
            ) : (
              <>
                <span>🇺🇸</span>
                <span className="hidden sm:inline">English</span>
              </>
            )}
          </Button>

          {/* User Dropdown */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background hover:bg-accent">
                <DropdownMenuLabel>
                  {session.user.name || session.user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/dashboard/${session.user.businessId}/overview`,
                    )
                  }
                >
                  <Package className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                {/* === For Admin === */}
                {session.user.role === "PLATFORM_ADMIN" && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin/merchants")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                {/* === END ADD === */}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button variant="default" size="sm">
                {locale === "ar" ? "تسجيل الدخول" : "Login"}
              </Button>
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === "ar" ? "right" : "left"}>
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium py-2 border-b"
                  >
                    {link.label}
                  </Link>
                ))}
                {!session?.user && (
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button className="w-full">Login</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

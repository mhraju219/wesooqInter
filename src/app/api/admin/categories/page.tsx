import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/auth/login");
  }

  return <CategoryManager />;
}
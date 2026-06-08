import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import CatalogManager from "@/components/admin/CatalogManager"; // default import

export default async function AdminCatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/auth/login");
  }

  const products = await prisma.catalogProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const productsForClient = products.map((product) => ({
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    businessCategoryId: product.businessCategoryId,
    categoryId: product.categoryId,
    images: product.images,
    isActive: product.isActive,
  }));

  return <CatalogManager initialProducts={productsForClient} />;
}
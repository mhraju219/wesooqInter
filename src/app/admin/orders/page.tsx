import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AdminOrderList } from "@/components/admin/AdminOrderList";

// Helper to extract business name from JSON
function getBusinessName(name: any): string {
  if (!name) return "—";
  if (typeof name === "string") return name;
  return name.en || name.ar || "—";
}

// Helper to extract product name from catalog product's name (could be JSON or string)
function getProductName(name: any): string {
  if (!name) return "Product";
  if (typeof name === "string") return name;
  return name.en || name.ar || "Product";
}

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/auth/login");
  }

  const orders = await prisma.order.findMany({
    include: {
      business: { select: { name: true, slug: true } },
      orderItems: {
        include: {
          product: {
            include: { catalogProduct: { select: { name: true } } }
          }
        }
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const ordersForClient = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    businessName: getBusinessName(order.business?.name),
    businessSlug: order.business?.slug,
    customerName: order.customerName || "Guest",
    total: Number(order.total),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    orderItems: order.orderItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
      productName: getProductName(item.product.catalogProduct.name),
    })),
  }));

  return <AdminOrderList orders={ordersForClient} />;
}
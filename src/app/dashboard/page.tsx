import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  if (!userId) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect("/auth/login");
  }

  if (user.role === "PLATFORM_ADMIN") {
    redirect("/admin");
  } else if (user.businessId) {
    // For merchants, redirect to their business dashboard
    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
      select: { slug: true },
    });
    if (business?.slug) {
      redirect(`/dashboard/${business.slug}/overview`);
    } else {
      redirect(`/dashboard/${user.businessId}/overview`);
    }
  } else {
    redirect("/auth/no-business");
  }
}
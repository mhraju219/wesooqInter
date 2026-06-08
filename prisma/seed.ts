// prisma/seed.ts
import { PrismaClient, UserRole, InventoryTransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Business Categories
  const businessCategoriesData = [
    { slug: 'hospital', nameEn: 'Hospital', nameAr: 'مستشفى' },
    { slug: 'supermarket', nameEn: 'Supermarket', nameAr: 'سوبر ماركت' },
    { slug: 'restaurant', nameEn: 'Restaurant', nameAr: 'مطعم' },
    { slug: 'electronics', nameEn: 'Electronics', nameAr: 'إلكترونيات' },
    { slug: 'flower-shop', nameEn: 'Flower Shop', nameAr: 'محل زهور' },
    { slug: 'mobile-accessories', nameEn: 'Mobile & Accessories', nameAr: 'جوالات وإكسسوارات' },
    { slug: 'vehicles', nameEn: 'Vehicles & Accessories', nameAr: 'مركبات وإكسسوارات' },
  ];

  const businessCategoryMap: Record<string, string> = {};
  for (const cat of businessCategoriesData) {
    const upserted = await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: { en: cat.nameEn, ar: cat.nameAr },
      },
    });
    businessCategoryMap[cat.slug] = upserted.id;
    console.log(`✅ Business category: ${cat.nameEn}`);
  }

  // 2. Create Platform Admin (Superadmin)
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@wesooq.com' },
    update: {},
    create: {
      email: 'superadmin@wesooq.com',
      passwordHash: adminPassword,
      fullName: { en: 'Platform Admin', ar: 'مدير المنصة' },
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Superadmin created: superadmin@wesooq.com / admin123');

  // 3. Create a test Hospital Business
  const hospitalCategoryId = businessCategoryMap['hospital'];
  const hospital = await prisma.business.upsert({
    where: { slug: 'city-hospital' },
    update: {},
    create: {
      slug: 'city-hospital',
      name: { en: 'City Hospital', ar: 'مستشفى المدينة' },
      businessCategoryId: hospitalCategoryId,
      contactPhone: '+1234567890',
      isActive: true,
      currencyCode: 'USD',
    },
  });
  console.log('✅ Hospital business created');

  // 3a. Create Hospital Admin (Business Owner)
  const hospitalAdminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: hospitalAdminPassword,
      fullName: { en: 'Hospital Admin', ar: 'مدير المستشفى' },
      role: UserRole.BUSINESS_OWNER,
      businessId: hospital.id,
      isActive: true,
    },
  });
  console.log('✅ Hospital admin: admin@test.com / admin123');

  // 3b. Create Services for Hospital
  const services = [
    { nameEn: 'General Checkup', nameAr: 'فحص عام', durationMins: 30, price: 50.0 },
    { nameEn: 'Dental Cleaning', nameAr: 'تنظيف أسنان', durationMins: 45, price: 80.0 },
    { nameEn: 'Eye Exam', nameAr: 'فحص عيون', durationMins: 30, price: 40.0 },
  ];
  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: '' }, // dummy, we use createMany? But we can use findFirst and update if needed; simpler to createMany with skipDuplicates? Not possible. We'll use create with uniqueness on (businessId, name) – but no unique constraint. For seeding, we can just create.
      update: {},
      create: {
        businessId: hospital.id,
        name: { en: svc.nameEn, ar: svc.nameAr },
        durationMins: svc.durationMins,
        price: svc.price,
        isActive: true,
      },
    });
  }
  console.log('✅ Hospital services created');

  // 4. Create a test Supermarket Business
  const supermarketCategoryId = businessCategoryMap['supermarket'];
  const supermarket = await prisma.business.upsert({
    where: { slug: 'fresh-market' },
    update: {},
    create: {
      slug: 'fresh-market',
      name: { en: 'Fresh Market', ar: 'سوق الطازج' },
      businessCategoryId: supermarketCategoryId,
      contactPhone: '+9876543210',
      isActive: true,
      currencyCode: 'USD',
    },
  });
  console.log('✅ Supermarket business created');

  // 4a. Create Global Catalog Products for Supermarket items
  const catalogProducts = [
    { barcode: '6290001000001', nameEn: 'Organic Milk', nameAr: 'حليب عضوي', category: 'SUPERMARKET', price: 4.99, cost: 3.5, stock: 50 },
    { barcode: '6290001000002', nameEn: 'Fresh Bread', nameAr: 'خبز طازج', category: 'SUPERMARKET', price: 2.49, cost: 1.2, stock: 30 },
    { barcode: '6290001000003', nameEn: 'Apples 1kg', nameAr: 'تفاح ١ كجم', category: 'SUPERMARKET', price: 3.99, cost: 2.5, stock: 100 },
  ];
  // We'll need to associate catalog products with the supermarket category (BusinessCategory id)
  for (const cp of catalogProducts) {
    const catalog = await prisma.catalogProduct.upsert({
      where: { barcode: cp.barcode },
      update: {},
      create: {
        barcode: cp.barcode,
        name: { en: cp.nameEn, ar: cp.nameAr },
        businessCategoryId: supermarketCategoryId,
        isActive: true,
      },
    });
    // Create merchant inventory (Product) for the supermarket
    // First, get the next SKU for the business (using counter)
    let counter = await prisma.businessCounter.findUnique({
      where: { businessId: supermarket.id },
    });
    if (!counter) {
      counter = await prisma.businessCounter.create({
        data: { businessId: supermarket.id, nextProductSku: 1001 },
      });
    }
    const sku = counter.nextProductSku.toString();
    await prisma.product.create({
      data: {
        catalogProductId: catalog.id,
        businessId: supermarket.id,
        costPrice: cp.cost,
        sellingPrice: cp.price,
        stockQuantity: cp.stock,
        availableOnline: true,
        sku: sku,
      },
    });
    // Increment counter
    await prisma.businessCounter.update({
      where: { businessId: supermarket.id },
      data: { nextProductSku: { increment: 1 } },
    });
  }
  console.log('✅ Supermarket products added');

  // 5. Optionally create a test Restaurant and Electronics (similar pattern)
  // For brevity, we can skip or add minimal examples

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
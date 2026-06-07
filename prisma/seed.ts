import { PrismaClient, BusinessCategory, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create platform admin (superadmin)
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
  console.log('✅ Platform admin: superadmin@wesooq.com / admin123');

  // 2. Create businesses
  const hospital = await prisma.business.upsert({
    where: { slug: 'city-hospital' },
    update: {},
    create: {
      slug: 'city-hospital',
      name: { en: 'City Hospital', ar: 'مستشفى المدينة' },
      category: BusinessCategory.HOSPITAL,
      contactPhone: '+1234567890',
      isActive: true,
      currencyCode: 'USD',
    },
  });

  const supermarket = await prisma.business.upsert({
    where: { slug: 'fresh-market' },
    update: {},
    create: {
      slug: 'fresh-market',
      name: { en: 'Fresh Market', ar: 'سوق الطازج' },
      category: BusinessCategory.SUPERMARKET,
      contactPhone: '+9876543210',
      isActive: true,
      currencyCode: 'USD',
    },
  });

  const restaurant = await prisma.business.upsert({
    where: { slug: 'tasty-bites' },
    update: {},
    create: {
      slug: 'tasty-bites',
      name: { en: 'Tasty Bites', ar: 'لقيمات لذيذة' },
      category: BusinessCategory.RESTAURANT,
      contactPhone: '+5556667777',
      isActive: true,
      currencyCode: 'USD',
    },
  });

  const electronics = await prisma.business.upsert({
    where: { slug: 'tech-zone' },
    update: {},
    create: {
      slug: 'tech-zone',
      name: { en: 'Tech Zone', ar: 'منطقة التقنية' },
      category: BusinessCategory.ELECTRONICS,
      contactPhone: '+1112223333',
      isActive: true,
      currencyCode: 'USD',
    },
  });
  console.log('✅ Businesses created');

  // 3. Hospital admin user
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

  // 4. Catalog products (global) – using category enum
  const catalogData = [
    // Supermarket products
    { barcode: '8901234567890', nameEn: 'Organic Milk', nameAr: 'حليب عضوي', category: BusinessCategory.SUPERMARKET },
    { barcode: '8901234567891', nameEn: 'Fresh Bread', nameAr: 'خبز طازج', category: BusinessCategory.SUPERMARKET },
    { barcode: '8901234567892', nameEn: 'Apples (1kg)', nameAr: 'تفاح ١ كجم', category: BusinessCategory.SUPERMARKET },
    // Restaurant products
    { barcode: '8901234567893', nameEn: 'Margherita Pizza', nameAr: 'بيتزا مارجريتا', category: BusinessCategory.RESTAURANT },
    { barcode: '8901234567894', nameEn: 'Caesar Salad', nameAr: 'سلطة سيزر', category: BusinessCategory.RESTAURANT },
    // Electronics products
    { barcode: '8901234567895', nameEn: 'Wireless Headphones', nameAr: 'سماعات لاسلكية', category: BusinessCategory.ELECTRONICS },
    { barcode: '8901234567896', nameEn: 'Smartphone Charger', nameAr: 'شاحن هاتف ذكي', category: BusinessCategory.ELECTRONICS },
  ];

  for (const p of catalogData) {
    await prisma.catalogProduct.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: {
        barcode: p.barcode,
        name: { en: p.nameEn, ar: p.nameAr },
        category: p.category,      // 👈 use the enum
        images: [],
        isActive: true,
      },
    });
  }
  console.log('✅ Catalog products created');

  // Helper to get catalog ID
  async function getCatalogId(barcode: string) {
    const cat = await prisma.catalogProduct.findUnique({ where: { barcode } });
    if (!cat) throw new Error(`Catalog not found: ${barcode}`);
    return cat.id;
  }

  // 5. Merchant inventory (Product)
  // Supermarket
  const milkId = await getCatalogId('8901234567890');
  const breadId = await getCatalogId('8901234567891');
  const applesId = await getCatalogId('8901234567892');
  await prisma.product.upsert({
    where: { sku: '1001' },
    update: {},
    create: {
      catalogProductId: milkId,
      businessId: supermarket.id,
      sku: '1001',
      costPrice: 3.5,
      sellingPrice: 4.99,
      stockQuantity: 50,
      availableOnline: true,
      isActive: true,
    },
  });
  await prisma.product.upsert({
    where: { sku: '1002' },
    update: {},
    create: {
      catalogProductId: breadId,
      businessId: supermarket.id,
      sku: '1002',
      costPrice: 1.2,
      sellingPrice: 2.49,
      stockQuantity: 30,
      availableOnline: true,
      isActive: true,
    },
  });
  await prisma.product.upsert({
    where: { sku: '1003' },
    update: {},
    create: {
      catalogProductId: applesId,
      businessId: supermarket.id,
      sku: '1003',
      costPrice: 2.5,
      sellingPrice: 3.99,
      stockQuantity: 100,
      availableOnline: true,
      isActive: true,
    },
  });

  // Restaurant
  const pizzaId = await getCatalogId('8901234567893');
  const saladId = await getCatalogId('8901234567894');
  await prisma.product.upsert({
    where: { sku: '2001' },
    update: {},
    create: {
      catalogProductId: pizzaId,
      businessId: restaurant.id,
      sku: '2001',
      costPrice: 5.0,
      sellingPrice: 12.99,
      stockQuantity: 20,
      availableOnline: true,
      isActive: true,
    },
  });
  await prisma.product.upsert({
    where: { sku: '2002' },
    update: {},
    create: {
      catalogProductId: saladId,
      businessId: restaurant.id,
      sku: '2002',
      costPrice: 3.0,
      sellingPrice: 8.99,
      stockQuantity: 15,
      availableOnline: true,
      isActive: true,
    },
  });

  // Electronics
  const headphonesId = await getCatalogId('8901234567895');
  const chargerId = await getCatalogId('8901234567896');
  await prisma.product.upsert({
    where: { sku: '3001' },
    update: {},
    create: {
      catalogProductId: headphonesId,
      businessId: electronics.id,
      sku: '3001',
      costPrice: 30.0,
      sellingPrice: 49.99,
      stockQuantity: 25,
      availableOnline: true,
      isActive: true,
    },
  });
  await prisma.product.upsert({
    where: { sku: '3002' },
    update: {},
    create: {
      catalogProductId: chargerId,
      businessId: electronics.id,
      sku: '3002',
      costPrice: 10.0,
      sellingPrice: 19.99,
      stockQuantity: 40,
      availableOnline: true,
      isActive: true,
    },
  });
  console.log('✅ Merchant inventory products created');

  // 6. Hospital services
  await prisma.service.createMany({
    data: [
      { businessId: hospital.id, name: { en: 'General Checkup', ar: 'فحص عام' }, durationMins: 30, price: 50.0, isActive: true },
      { businessId: hospital.id, name: { en: 'Dental Cleaning', ar: 'تنظيف أسنان' }, durationMins: 45, price: 80.0, isActive: true },
      { businessId: hospital.id, name: { en: 'Eye Exam', ar: 'فحص عيون' }, durationMins: 30, price: 40.0, isActive: true },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Hospital services added');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });